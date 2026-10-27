-- Vanduo Marse: starter coupon catalogue. Editable in /admin/kuponai afterwards.
--
-- Experience prices are read from the live tables instead of retyped, so the
-- starting values match the sauna rates and cabin price already in the
-- database. After this they are independent snapshots: changing a sauna rate
-- later does not move the coupon price (edit it in /admin/kuponai).
-- The park rows mirror the 2026-27 sheet: 2 h nuo 17:00 = 25 EUR, visa diena = 35 EUR.

insert into public.coupon_products (id, kind, service, name, description, value, sort_order) values
  ('verte-25', 'verte', 'visi', 'Dovanų kuponas 25 €', 'Panaudojamas bet kuriai paslaugai: plaukimui, pirčiai ar nakvynei.', 25, 0),
  ('verte-50', 'verte', 'visi', 'Dovanų kuponas 50 €', 'Panaudojamas bet kuriai paslaugai: plaukimui, pirčiai ar nakvynei.', 50, 1),
  ('verte-100', 'verte', 'visi', 'Dovanų kuponas 100 €', 'Panaudojamas bet kuriai paslaugai: plaukimui, pirčiai ar nakvynei.', 100, 2),
  ('kabelis-2val', 'paslauga', 'kabelis', 'Plaukimas 2 val.', 'Dviejų valandų plaukimas kabeline trasa vienam suaugusiajam.', 25, 3),
  ('kabelis-diena', 'paslauga', 'kabelis', 'Visos dienos plaukimas', 'Visa diena trasoje vienam suaugusiajam.', 35, 4);

insert into public.coupon_products (id, kind, service, name, description, value, sort_order)
select 'pirtis-2val', 'paslauga', 'pirtis', 'Pirtis Marse, ' || s.min_hours || ' val.',
       'Pirtis visai grupei iki ' || s.small_group_max || ' žmonių, minimalus ' || s.min_hours || ' val. seansas.',
       s.small_group_rate * s.min_hours, 5
from public.sauna_settings s;

insert into public.coupon_products (id, kind, service, name, description, value, sort_order)
select 'miegas-namelis', 'paslauga', 'miegas', 'Namelis 2 asmenims, 1 naktis',
       'Viena naktis namelyje dviem prie trasos.', t.price_per_night, 6
from public.stay_types t
where t.id = 'namelis-2';
