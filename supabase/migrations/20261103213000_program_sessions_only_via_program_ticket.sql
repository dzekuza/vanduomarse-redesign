-- Program sessions (events.program_id) are priced from their program by
-- create_program_ticket (adults and children, current program price). The older
-- create_event_ticket prices from events.price per person, so it must not be able
-- to book them: that would skip the child price and use a stale event price after
-- the program's price changes. Same body as before plus `program_id is null`;
-- create or replace keeps the existing grants.

create or replace function public.create_event_ticket(
  p_event_id uuid,
  p_people smallint,
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
begin
  select * into e from public.events
   where events.id = p_event_id and category <> 'keturratis' and published and capacity is not null
     and program_id is null
     and date >= (now() at time zone 'Europe/Vilnius')::date;
  if not found then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;
  if p_people < 1 or p_people > 20 then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  -- The capacity trigger raises 23P01 / event_full when the seats are gone;
  -- the PR- reference comes from the ticket reference trigger.
  return query
  insert into public.event_tickets (event_id, customer_name, customer_email, customer_phone,
                                    people, total, status, source)
  values (e.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_people, p_people * coalesce(e.price, 0), 'laukia', 'svetaine')
  returning event_tickets.id, event_tickets.reference, event_tickets.total;
end;
$$;
