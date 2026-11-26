-- Vanduo Marse: the "Stovykla" (camp) event type for the price calculator.
--
-- The calculator gives a camp its own flow (days, the dome at a daily rate, meals, activities), keyed to the id
-- 'stovykla' in lib/event-pricing.ts. A camp has no typical price per guest, so both bounds are 0 and the page
-- hides that line. Listed first. Editable in /admin/kainos like the other types; keep the id.

insert into public.event_presets (id, label, per_guest_min, per_guest_max, adults, kids, sort_order)
values ('stovykla', 'Stovykla', 0, 0, 30, 0, 5)
on conflict (id) do nothing;
