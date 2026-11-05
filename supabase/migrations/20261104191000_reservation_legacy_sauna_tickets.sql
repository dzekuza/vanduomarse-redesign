-- The reservation can also sell tickets for published legacy sauna sessions.
-- Keep the existing RPC signature, grants and event ticket triggers.

create or replace function public.create_program_ticket(
  p_event_id uuid,
  p_adults smallint,
  p_children smallint,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  pr public.sauna_programs;
  v_people integer := p_adults::integer + p_children;
  v_total numeric;
begin
  select * into e from public.events
   where events.id = p_event_id and events.category = 'pirtis'
     and events.published and events.capacity is not null
   for update;
  if not found or e.date + e.start_time <= (clock_timestamp() at time zone 'Europe/Vilnius') then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;

  if e.program_id is not null then
    select * into pr from public.sauna_programs
     where sauna_programs.id = e.program_id and sauna_programs.active and sauna_programs.kind = 'session';
    if not found then
      raise exception 'Program unavailable' using errcode = '23503', hint = 'event_unavailable';
    end if;
  end if;

  if v_people is null or p_adults < 0 or p_children < 0 or v_people < 1 or v_people > 20
     or (pr.pricing is distinct from 'family' and p_children > 0)
     or (pr.pricing = 'family' and p_adults < 1) then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_total := case when e.program_id is null then v_people * coalesce(e.price, 0)
    else p_adults * pr.price + p_children * coalesce(pr.child_price, pr.price) end;

  -- The existing trigger checks live capacity and raises event_full when needed.
  return query
  insert into public.event_tickets (event_id, customer_name, customer_email, customer_phone,
                                    people, children, total, status, source)
  values (e.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_people, p_children, v_total, 'laukia', 'svetaine')
  returning event_tickets.id, event_tickets.reference, event_tickets.total;
end;
$$;
