-- Quad tours are booked at any time, for at least 5 quads (owner, 2026-11-12). Reverses ADR-0055.
--
-- * The Mini / Midi / Maxi products are no longer sold on dated departures (events with tour_route_id);
--   a tour starts at any hour the free fleet covers for the whole route, so the public booking calls
--   create_quad_tour_rental(route, date, start, quads, gear, ...) directly. That function already checks
--   the route and gear rows, opening hours, the 120-day window, the rate limit and the fleet, and prices
--   the tour itself. The departures migration revoked it from the public roles; grant it back.
-- * The shortest group is 5 quads on every route (editable per route in /admin/keturraciai).
-- Departure columns, create_quad_tour_departure_rental and old departure events are left in place (unused).

grant execute on function public.create_quad_tour_rental(text, date, smallint, smallint, jsonb, text, text, text, text, text) to anon, authenticated;

update public.quad_tour_routes set min_units = 5;
