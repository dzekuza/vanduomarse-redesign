-- Vanduo Marse: spots staff set aside on a limited event (ADR-0090).
--
-- A sauna session with 20 places can have some of them taken without a booking, for example for the owner's family
-- or friends: staff set `events.held` in the admin and the public site, the checkout and the capacity check all count
-- those places as taken. `held` is a plain number kept by staff; `sold` stays the count of real, non-cancelled tickets.
--
-- Rules: held >= 0; held + sold may not exceed capacity (checked when staff change `held` or `capacity`); an event with no
-- limit (capacity null) cannot hold places.

alter table public.events add column held integer not null default 0 check (held >= 0);

comment on column public.events.held is
  'Places staff have set aside without a booking (family, friends). Counted as taken by the capacity check and the public seats left; sold stays real tickets only.';

-- Ticket sales respect capacity minus the held places. Same function as before (security definer, empty search_path),
-- with `held` added to what is already taken.
create or replace function public.enforce_ticket_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_held integer;
  v_taken integer;
begin
  if new.status = 'atsaukta' then
    return new;
  end if;

  -- Row lock serialises concurrent ticket sales for the same event.
  select e.capacity, e.held into v_capacity, v_held from public.events e where e.id = new.event_id for update;
  if v_capacity is null then
    return new;
  end if;

  select coalesce(sum(t.people), 0) into v_taken
  from public.event_tickets t
  where t.event_id = new.event_id and t.status <> 'atsaukta' and t.id <> new.id;

  if v_taken + v_held + new.people > v_capacity then
    raise exception 'Only % spots left', greatest(v_capacity - v_held - v_taken, 0)
      using errcode = '23P01', hint = 'event_full';
  end if;
  return new;
end;
$$;

-- Held places can never push an event past its capacity, and an unlimited event cannot hold any.
create function private.check_event_held()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.held > 0 and (new.capacity is null or new.held + new.sold > new.capacity) then
    raise exception 'Held places exceed the free places' using errcode = '23514', hint = 'held_too_many';
  end if;
  return new;
end;
$$;

revoke execute on function private.check_event_held() from public, anon, authenticated;

create trigger events_check_held
  before insert or update of held, capacity on public.events
  for each row execute function private.check_event_held();
