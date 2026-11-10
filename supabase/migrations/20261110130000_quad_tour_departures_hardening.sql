-- Vanduo Marse: close two bypasses left by the quad tour departures migration (ADR-0055).
--
-- 1. create_quad_tour_rental() books a tour on any date; it was meant to be reached only
--    through create_quad_tour_departure_rental(), which checks a published departure and its
--    capacity. Direct callers (anon / authenticated) skipped that gate. The wrapper is a
--    security definer owned by the same role, so it keeps working without the grant.
-- 2. create_tour_ticket() (per-person tickets) accepts any published keturratis event with a
--    capacity, including a departure, and event_tickets sync would then overwrite the
--    quads-based events.sold. Departures are now rejected for every event_tickets insert.

revoke execute on function public.create_quad_tour_rental(text, date, smallint, smallint, jsonb, text, text, text, text, text) from public, anon, authenticated;

create function private.reject_departure_tickets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.events e where e.id = new.event_id and e.tour_route_id is not null) then
    raise exception 'A tour departure is booked per quad, not per person' using errcode = '23514', hint = 'quad_tour_departure';
  end if;
  return new;
end;
$$;

revoke execute on function private.reject_departure_tickets() from public, anon, authenticated;

create trigger event_tickets_no_departures
  before insert or update of event_id on public.event_tickets
  for each row execute function private.reject_departure_tickets();
