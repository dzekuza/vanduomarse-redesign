-- Vanduo Marse: starter quad fleet and settings.
--
-- PLACEHOLDERS. The client has not supplied the real fleet, prices or rules, so
-- these are sensible stand-ins to be corrected in /admin/keturraciai ("Parkas")
-- before the page is promoted. No rules text or deposit is invented: both start
-- empty/zero, which hides them on the public page.

insert into public.quad_types (id, name, description, seats, units, price_per_hour, sort_order) values
  ('keturratis-1', 'Keturratis vienam', 'Vienvietis keturratis vienam važiuotojui.', 1, 4, 30, 0),
  ('keturratis-2', 'Keturratis dviem', 'Dvivietis keturratis: vairuotojas ir keleivis.', 2, 2, 45, 1);

insert into public.quad_settings (id, open_hour, close_hour, max_hours, deposit, min_age, rules)
values (true, 10, 20, 3, 0, 18, '');
