-- Vanduo Marse: DEMO data (fake customers), generated from the former
-- lib/admin/mock-data.ts. Dates are relative to current_date (Vilnius time) so
-- the dashboard always looks current. Loaded into the Vanduo project on
-- 2026-10-22 for review; delete it before go-live (see obsidian/backend/database.md).

set time zone 'Europe/Vilnius';

-- Bookings
insert into public.bookings (reference, kind, customer_name, customer_email, customer_phone, date, start_hour, hours, nights, stay_type_id, guests, total, status, source, note, created_at) values
  ('PM-1000', 'pirtis', 'Lukas Petrauskas', 'lukas.petrauskas@pastas.lt', '+370 65979930', current_date - 7, 10, 4, null, null, 10, 350, 'ivykdyta', 'svetaine', null, (current_date - 10)::timestamptz),
  ('MM-1001', 'kemperis', 'Eglė Jankauskaitė', 'egle.jankauskaite@pastas.lt', '+370 65812655', current_date - 7, null, null, 1, 'kemperis', 2, 25, 'ivykdyta', 'svetaine', null, (current_date - 13)::timestamptz),
  ('MM-1002', 'kemperis', 'Austėja Petrauskas', 'austeja.petrauskas@pastas.lt', '+370 62292916', current_date - 7, null, null, 1, 'kemperis', 2, 25, 'ivykdyta', 'svetaine', null, (current_date - 11)::timestamptz),
  ('PM-1003', 'pirtis', 'Darius Stankevičius', 'darius.stankevicius@pastas.lt', '+370 69693907', current_date - 6, 10, 4, null, null, 2, 280, 'ivykdyta', 'svetaine', null, (current_date - 16)::timestamptz),
  ('PM-1004', 'pirtis', 'Agnė Kazlauskienė', 'agne.kazlauskiene@pastas.lt', '+370 67912142', current_date - 6, 16, 2, null, null, 4, 140, 'ivykdyta', 'svetaine', null, (current_date - 11)::timestamptz),
  ('MM-1005', 'kemperis', 'Mantas Jankauskaitė', 'mantas.jankauskaite@pastas.lt', '+370 62249120', current_date - 6, null, null, 3, 'kemperis', 2, 75, 'ivykdyta', 'svetaine', null, (current_date - 9)::timestamptz),
  ('MM-1006', 'kemperis', 'Rūta Stankevičius', 'ruta.stankevicius@pastas.lt', '+370 64030938', current_date - 6, null, null, 1, 'kemperis', 2, 25, 'ivykdyta', 'svetaine', null, (current_date - 8)::timestamptz),
  ('PM-1007', 'pirtis', 'Tomas Butkutė', 'tomas.butkute@pastas.lt', '+370 66842494', current_date - 5, 12, 3, null, null, 11, 300, 'ivykdyta', 'svetaine', null, (current_date - 15)::timestamptz),
  ('PM-1008', 'pirtis', 'Paulius Kazlauskienė', 'paulius.kazlauskiene@pastas.lt', '+370 65644661', current_date - 5, 17, 3, null, null, 13, 300, 'ivykdyta', 'svetaine', null, (current_date - 13)::timestamptz),
  ('MM-1009', 'kemperis', 'Paulius Žukauskas', 'paulius.zukauskas@pastas.lt', '+370 66781162', current_date - 5, null, null, 2, 'kemperis', 2, 50, 'ivykdyta', 'svetaine', null, (current_date - 17)::timestamptz),
  ('MM-1010', 'kemperis', 'Rūta Kazlauskienė', 'ruta.kazlauskiene@pastas.lt', '+370 61216655', current_date - 5, null, null, 1, 'kemperis', 2, 25, 'ivykdyta', 'svetaine', null, (current_date - 20)::timestamptz),
  ('PM-1011', 'pirtis', 'Karolis Jankauskaitė', 'karolis.jankauskaite@pastas.lt', '+370 69876477', current_date - 4, 12, 2, null, null, 9, 200, 'ivykdyta', 'svetaine', null, (current_date - 13)::timestamptz),
  ('PM-1012', 'pirtis', 'Ieva Petrauskas', 'ieva.petrauskas@pastas.lt', '+370 64565496', current_date - 4, 16, 4, null, null, 3, 280, 'ivykdyta', 'svetaine', null, (current_date - 13)::timestamptz),
  ('MM-1013', 'kemperis', 'Darius Stankevičius', 'darius.stankevicius@pastas.lt', '+370 69598497', current_date - 4, null, null, 3, 'kemperis', 2, 75, 'ivykdyta', 'svetaine', null, (current_date - 12)::timestamptz),
  ('MM-1014', 'namelis', 'Paulius Vasiliauskaitė', 'paulius.vasiliauskaite@pastas.lt', '+370 62709277', current_date - 4, null, null, 2, 'namelis-4', 3, 100, 'ivykdyta', 'svetaine', null, (current_date - 12)::timestamptz),
  ('PM-1015', 'pirtis', 'Rūta Kazlauskienė', 'ruta.kazlauskiene@pastas.lt', '+370 61965055', current_date - 3, 11, 2, null, null, 7, 205, 'ivykdyta', 'svetaine', null, (current_date - 13)::timestamptz),
  ('PM-1016', 'pirtis', 'Gabija Vasiliauskaitė', 'gabija.vasiliauskaite@pastas.lt', '+370 65769908', current_date - 2, 11, 4, null, null, 6, 280, 'ivykdyta', 'svetaine', null, (current_date - 7)::timestamptz),
  ('PM-1017', 'pirtis', 'Paulius Vasiliauskaitė', 'paulius.vasiliauskaite@pastas.lt', '+370 67972036', current_date - 2, 17, 2, null, null, 8, 210, 'ivykdyta', 'svetaine', null, (current_date - 6)::timestamptz),
  ('PM-1018', 'pirtis', 'Lukas Jankauskaitė', 'lukas.jankauskaite@pastas.lt', '+370 65833365', current_date - 1, 11, 4, null, null, 6, 280, 'ivykdyta', 'svetaine', null, (current_date - 10)::timestamptz),
  ('PM-1019', 'pirtis', 'Gabija Navickas', 'gabija.navickas@pastas.lt', '+370 65955891', current_date - 1, 17, 4, null, null, 12, 350, 'ivykdyta', 'svetaine', null, (current_date - 3)::timestamptz),
  ('MM-1020', 'kemperis', 'Eglė Jankauskaitė', 'egle.jankauskaite@pastas.lt', '+370 61814687', current_date - 1, null, null, 3, 'kemperis', 2, 75, 'ivykdyta', 'svetaine', null, (current_date - 12)::timestamptz),
  ('PM-1021', 'pirtis', 'Karolis Vasiliauskaitė', 'karolis.vasiliauskaite@pastas.lt', '+370 68459034', current_date, 12, 2, null, null, 5, 240, 'patvirtinta', 'svetaine', null, (current_date - 3)::timestamptz),
  ('PM-1022', 'pirtis', 'Paulius Butkutė', 'paulius.butkute@pastas.lt', '+370 67529715', current_date, 16, 2, null, null, 8, 200, 'patvirtinta', 'svetaine', null, (current_date - 6)::timestamptz),
  ('PM-1023', 'pirtis', 'Lukas Butkutė', 'lukas.butkute@pastas.lt', '+370 65961717', current_date, 19, 3, null, null, 7, 400, 'patvirtinta', 'svetaine', null, (current_date - 10)::timestamptz),
  ('PM-1024', 'pirtis', 'Austėja Jankauskaitė', 'austeja.jankauskaite@pastas.lt', '+370 65438109', current_date + 1, 10, 3, null, null, 12, 300, 'patvirtinta', 'svetaine', null, (current_date - 6)::timestamptz),
  ('PM-1025', 'pirtis', 'Agnė Petrauskas', 'agne.petrauskas@pastas.lt', '+370 67773615', current_date + 1, 15, 3, null, null, 12, 300, 'laukia', 'svetaine', null, (current_date + 0)::timestamptz),
  ('PM-1026', 'pirtis', 'Karolis Kazlauskienė', 'karolis.kazlauskiene@pastas.lt', '+370 61769063', current_date + 2, 11, 4, null, null, 10, 450, 'patvirtinta', 'svetaine', null, (current_date - 6)::timestamptz),
  ('PM-1027', 'pirtis', 'Mantas Stankevičius', 'mantas.stankevicius@pastas.lt', '+370 68492237', current_date + 3, 11, 3, null, null, 7, 320, 'laukia', 'svetaine', null, (current_date + 1)::timestamptz),
  ('MM-1028', 'namelis', 'Darius Jankauskaitė', 'darius.jankauskaite@pastas.lt', '+370 61852964', current_date + 3, null, null, 3, 'namelis-2', 2, 150, 'patvirtinta', 'svetaine', null, (current_date - 8)::timestamptz),
  ('MM-1029', 'namelis', 'Agnė Butkutė', 'agne.butkute@pastas.lt', '+370 64838365', current_date + 3, null, null, 2, 'namelis-4', 4, 100, 'laukia', 'svetaine', null, (current_date - 9)::timestamptz),
  ('PM-1030', 'pirtis', 'Karolis Žukauskas', 'karolis.zukauskas@pastas.lt', '+370 66180871', current_date + 4, 10, 2, null, null, 12, 320, 'patvirtinta', 'svetaine', null, (current_date + 2)::timestamptz),
  ('PM-1031', 'pirtis', 'Karolis Jankauskaitė', 'karolis.jankauskaite@pastas.lt', '+370 62397025', current_date + 5, 11, 4, null, null, 2, 285, 'laukia', 'svetaine', null, (current_date + 1)::timestamptz),
  ('PM-1032', 'pirtis', 'Austėja Stankevičius', 'austeja.stankevicius@pastas.lt', '+370 67318523', current_date + 5, 17, 4, null, null, 12, 350, 'patvirtinta', 'svetaine', null, (current_date + 1)::timestamptz),
  ('MM-1033', 'namelis', 'Lukas Butkutė', 'lukas.butkute@pastas.lt', '+370 67076534', current_date + 5, null, null, 1, 'namelis-4', 3, 50, 'patvirtinta', 'svetaine', null, (current_date + 0)::timestamptz),
  ('PM-1034', 'pirtis', 'Ieva Stankevičius', 'ieva.stankevicius@pastas.lt', '+370 66643156', current_date + 6, 12, 3, null, null, 6, 225, 'laukia', 'svetaine', null, (current_date + 1)::timestamptz),
  ('PM-1035', 'pirtis', 'Agnė Vasiliauskaitė', 'agne.vasiliauskaite@pastas.lt', '+370 65019156', current_date + 6, 17, 4, null, null, 8, 370, 'laukia', 'svetaine', null, (current_date + 1)::timestamptz),
  ('MM-1036', 'kemperis', 'Karolis Petrauskas', 'karolis.petrauskas@pastas.lt', '+370 65335172', current_date + 6, null, null, 2, 'kemperis', 2, 50, 'laukia', 'svetaine', null, (current_date + 4)::timestamptz),
  ('MM-1037', 'kemperis', 'Rūta Kazlauskienė', 'ruta.kazlauskiene@pastas.lt', '+370 65337545', current_date + 6, null, null, 3, 'kemperis', 2, 75, 'patvirtinta', 'svetaine', null, (current_date + 0)::timestamptz),
  ('PM-1038', 'pirtis', 'Darius Kazlauskienė', 'darius.kazlauskiene@pastas.lt', '+370 65921227', current_date + 7, 11, 2, null, null, 8, 205, 'patvirtinta', 'svetaine', null, (current_date + 0)::timestamptz),
  ('PM-1039', 'pirtis', 'Paulius Butkutė', 'paulius.butkute@pastas.lt', '+370 66535110', current_date + 7, 15, 4, null, null, 8, 350, 'patvirtinta', 'svetaine', null, (current_date + 0)::timestamptz),
  ('MM-1040', 'kemperis', 'Gabija Stankevičius', 'gabija.stankevicius@pastas.lt', '+370 62351868', current_date + 7, null, null, 3, 'kemperis', 2, 75, 'laukia', 'svetaine', null, (current_date - 8)::timestamptz),
  ('MM-1041', 'namelis', 'Agnė Stankevičius', 'agne.stankevicius@pastas.lt', '+370 65667943', current_date + 7, null, null, 3, 'namelis-4', 4, 150, 'laukia', 'svetaine', null, (current_date + 3)::timestamptz),
  ('PM-1042', 'pirtis', 'Tomas Petrauskas', 'tomas.petrauskas@pastas.lt', '+370 63278887', current_date + 8, 10, 3, null, null, 5, 330, 'patvirtinta', 'svetaine', null, (current_date + 7)::timestamptz),
  ('PM-1043', 'pirtis', 'Darius Žukauskas', 'darius.zukauskas@pastas.lt', '+370 67931658', current_date + 8, 15, 2, null, null, 13, 200, 'laukia', 'svetaine', null, (current_date + 4)::timestamptz),
  ('PM-1044', 'pirtis', 'Rūta Kazlauskienė', 'ruta.kazlauskiene@pastas.lt', '+370 64588116', current_date + 8, 19, 3, null, null, 8, 315, 'laukia', 'svetaine', null, (current_date + 0)::timestamptz),
  ('PM-1045', 'pirtis', 'Austėja Kazlauskienė', 'austeja.kazlauskiene@pastas.lt', '+370 62770222', current_date + 9, 10, 4, null, null, 12, 350, 'laukia', 'svetaine', null, (current_date + 4)::timestamptz),
  ('PM-1046', 'pirtis', 'Darius Žukauskas', 'darius.zukauskas@pastas.lt', '+370 63710816', current_date + 9, 15, 2, null, null, 7, 205, 'laukia', 'svetaine', null, (current_date + 4)::timestamptz),
  ('MM-1047', 'kemperis', 'Karolis Navickas', 'karolis.navickas@pastas.lt', '+370 64000540', current_date + 9, null, null, 3, 'kemperis', 2, 75, 'patvirtinta', 'svetaine', null, (current_date - 4)::timestamptz),
  ('MM-1048', 'kemperis', 'Gabija Stankevičius', 'gabija.stankevicius@pastas.lt', '+370 63887709', current_date + 9, null, null, 3, 'kemperis', 2, 75, 'patvirtinta', 'svetaine', null, (current_date - 4)::timestamptz),
  ('PM-1049', 'pirtis', 'Darius Navickas', 'darius.navickas@pastas.lt', '+370 63698972', current_date + 10, 11, 2, null, null, 8, 210, 'laukia', 'svetaine', null, (current_date + 4)::timestamptz),
  ('PM-1050', 'pirtis', 'Gabija Vasiliauskaitė', 'gabija.vasiliauskaite@pastas.lt', '+370 67946046', current_date + 10, 14, 2, null, null, 2, 150, 'patvirtinta', 'svetaine', null, (current_date + 4)::timestamptz),
  ('PM-1051', 'pirtis', 'Eglė Navickas', 'egle.navickas@pastas.lt', '+370 68158406', current_date + 10, 18, 4, null, null, 8, 350, 'patvirtinta', 'svetaine', null, (current_date + 6)::timestamptz),
  ('MM-1052', 'kemperis', 'Eglė Vasiliauskaitė', 'egle.vasiliauskaite@pastas.lt', '+370 67744982', current_date + 10, null, null, 3, 'kemperis', 2, 75, 'patvirtinta', 'svetaine', null, (current_date - 2)::timestamptz),
  ('PM-1053', 'pirtis', 'Gabija Vasiliauskaitė', 'gabija.vasiliauskaite@pastas.lt', '+370 65597653', current_date + 11, 11, 2, null, null, 11, 210, 'patvirtinta', 'svetaine', null, (current_date + 1)::timestamptz),
  ('PM-1054', 'pirtis', 'Lukas Butkutė', 'lukas.butkute@pastas.lt', '+370 64672778', current_date + 11, 15, 2, null, null, 9, 300, 'patvirtinta', 'svetaine', null, (current_date + 4)::timestamptz),
  ('PM-1055', 'pirtis', 'Mantas Stankevičius', 'mantas.stankevicius@pastas.lt', '+370 64112662', current_date + 11, 19, 2, null, null, 4, 160, 'patvirtinta', 'svetaine', null, (current_date + 8)::timestamptz),
  ('MM-1056', 'kemperis', 'Karolis Kazlauskienė', 'karolis.kazlauskiene@pastas.lt', '+370 66625689', current_date + 11, null, null, 1, 'kemperis', 2, 25, 'patvirtinta', 'svetaine', null, (current_date + 7)::timestamptz),
  ('PM-1057', 'pirtis', 'Rūta Jankauskaitė', 'ruta.jankauskaite@pastas.lt', '+370 64914060', current_date + 12, 12, 4, null, null, 2, 380, 'laukia', 'svetaine', null, (current_date + 10)::timestamptz),
  ('PM-1058', 'pirtis', 'Lukas Jankauskaitė', 'lukas.jankauskaite@pastas.lt', '+370 61778493', current_date + 12, 17, 4, null, null, 13, 350, 'laukia', 'svetaine', null, (current_date + 6)::timestamptz),
  ('MM-1059', 'namelis', 'Agnė Žukauskas', 'agne.zukauskas@pastas.lt', '+370 67394460', current_date + 12, null, null, 1, 'namelis-4', 4, 50, 'laukia', 'svetaine', null, (current_date + 0)::timestamptz),
  ('MM-1060', 'kemperis', 'Austėja Vasiliauskaitė', 'austeja.vasiliauskaite@pastas.lt', '+370 65173406', current_date + 12, null, null, 2, 'kemperis', 2, 50, 'laukia', 'svetaine', null, (current_date + 7)::timestamptz),
  ('PM-1061', 'pirtis', 'Ieva Vasiliauskaitė', 'ieva.vasiliauskaite@pastas.lt', '+370 67283010', current_date + 13, 12, 3, null, null, 11, 300, 'patvirtinta', 'svetaine', null, (current_date + 10)::timestamptz),
  ('MM-1062', 'kemperis', 'Lukas Butkutė', 'lukas.butkute@pastas.lt', '+370 68502140', current_date + 13, null, null, 2, 'kemperis', 2, 50, 'laukia', 'svetaine', null, (current_date + 11)::timestamptz),
  ('MM-1063', 'namelis', 'Paulius Navickas', 'paulius.navickas@pastas.lt', '+370 68098883', current_date + 13, null, null, 3, 'namelis-4', 3, 150, 'patvirtinta', 'svetaine', null, (current_date + 6)::timestamptz);

insert into public.booking_extras (booking_id, upsell_id, name, unit, unit_price, quantity, line_total)
select b.id, v.upsell_id, v.name, v.unit::public.upsell_unit, v.unit_price, v.quantity, v.line_total
from (values
  ('PM-1015', 'vantos', 'Beržinė vanta', 'vienetui', 5, 1, 5),
  ('PM-1017', 'vantos', 'Beržinė vanta', 'vienetui', 5, 2, 10),
  ('PM-1021', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1023', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1026', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1027', 'vantos', 'Beržinė vanta', 'vienetui', 5, 4, 20),
  ('PM-1030', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1030', 'vantos', 'Beržinė vanta', 'vienetui', 5, 4, 20),
  ('PM-1031', 'vantos', 'Beržinė vanta', 'vienetui', 5, 1, 5),
  ('PM-1034', 'vantos', 'Beržinė vanta', 'vienetui', 5, 3, 15),
  ('PM-1035', 'vantos', 'Beržinė vanta', 'vienetui', 5, 4, 20),
  ('PM-1038', 'vantos', 'Beržinė vanta', 'vienetui', 5, 1, 5),
  ('PM-1042', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1042', 'vantos', 'Beržinė vanta', 'vienetui', 5, 4, 20),
  ('PM-1044', 'vantos', 'Beržinė vanta', 'vienetui', 5, 3, 15),
  ('PM-1046', 'vantos', 'Beržinė vanta', 'vienetui', 5, 1, 5),
  ('PM-1049', 'vantos', 'Beržinė vanta', 'vienetui', 5, 2, 10),
  ('PM-1050', 'vantos', 'Beržinė vanta', 'vienetui', 5, 2, 10),
  ('PM-1053', 'vantos', 'Beržinė vanta', 'vienetui', 5, 2, 10),
  ('PM-1054', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100),
  ('PM-1055', 'vantos', 'Beržinė vanta', 'vienetui', 5, 4, 20),
  ('PM-1057', 'pirtininkas', 'Pirtininkas', 'rezervacijai', 100, 1, 100)
) as v(reference, upsell_id, name, unit, unit_price, quantity, line_total)
join public.bookings b on b.reference = v.reference;

select setval('public.booking_reference_pm_seq', (select coalesce(max(split_part(reference, '-', 2)::int), 1000) from public.bookings where reference like 'PM-%'));
select setval('public.booking_reference_mm_seq', (select coalesce(max(split_part(reference, '-', 2)::int), 1000) from public.bookings where reference like 'MM-%'));

-- Sauna blocks (skipped if a demo booking already covers the hour)
insert into public.sauna_blocks (date, hour, reason)
select v.date, v.hour, v.reason from (values
  (current_date + 3, 20, 'Krosnies priežiūra'),
  (current_date + 3, 21, 'Krosnies priežiūra')
) as v(date, hour, reason)
where not exists (
  select 1 from public.bookings b
  where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date = v.date
    and v.hour >= b.start_hour and v.hour < b.start_hour + b.hours
);

-- Inquiries and notes
insert into public.inquiries (id, customer_name, customer_email, customer_phone, source, event_type, date, guests, space, estimate_min, estimate_max, message, status, created_at) values
  ('cbbe86dd-9e56-4fc9-b745-22e7d1c6cc74', 'Darius Žukauskas', 'darius.zukauskas@pastas.lt', '+370 68672192', 'skaiciuokle', 'Vestuvės', current_date + 210, 120, 'Kupolas + „Corona“', 5750, 6100, 'Norėtume aptarti meniu ir nakvynę svečiams.', 'nauja', (current_date - 2)::timestamptz),
  ('17340a4b-0ca9-48c0-b9df-b46737c6effb', 'Rūta Butkutė', 'ruta.butkute@pastas.lt', '+370 63459051', 'skaiciuokle', 'Komandos diena', current_date + 32, 40, 'Kupolas: seminaras', 3037, 3407, 'Ar galima WAKE perkelti į popietę?', 'nauja', (current_date - 2)::timestamptz),
  ('e7345bd0-4dfe-41bf-8a1b-e7987aade84a', 'Austėja Žukauskas', 'austeja.zukauskas@pastas.lt', '+370 63249313', 'renginys', 'Vandenlenčių filmų vakaras', current_date + 9, 4, 'Skoniai Marse', null, null, 'Registruojame 4 asmenis.', 'susisiekta', (current_date - 4)::timestamptz),
  ('1c7d1e5b-cf13-4ed7-bb3a-9dbfbfe44855', 'Gabija Jankauskaitė', 'gabija.jankauskaite@pastas.lt', '+370 62775284', 'skaiciuokle', 'Gimtadienis', current_date + 18, 25, 'Įstiklinta terasa', 1220, 1470, 'Jubiliejus, 50 m.', 'pasiulymas', (current_date - 4)::timestamptz),
  ('58ebbb56-32f6-4d0e-87e8-13794c3dca16', 'Gabija Butkutė', 'gabija.butkute@pastas.lt', '+370 61034586', 'kontaktai', 'Konferencija', current_date + 45, 60, 'Kupolas: seminaras', 1483, 1913, 'Reikia ekrano ir mikrofonų.', 'pasiulymas', (current_date - 5)::timestamptz),
  ('58241300-e011-4aea-89ff-f16f9c68d98e', 'Austėja Kazlauskienė', 'austeja.kazlauskiene@pastas.lt', '+370 66330915', 'skaiciuokle', 'Bernvakaris / mergvakaris', current_date + 12, 15, 'Įstiklinta terasa', 2930, 3330, 'Su nakvyne ir keturračiais.', 'pasiulymas', (current_date - 5)::timestamptz),
  ('c9400873-f42a-4210-92aa-b12b3b808354', 'Mantas Kazlauskienė', 'mantas.kazlauskiene@pastas.lt', '+370 62671201', 'skaiciuokle', 'Krikštynos', current_date + 6, 25, 'Įstiklinta terasa', 1000, 1250, 'Data netiko, ieškos kitur.', 'susisiekta', (current_date - 8)::timestamptz);

insert into public.inquiry_notes (inquiry_id, text, created_at) values
  ('e7345bd0-4dfe-41bf-8a1b-e7987aade84a', 'Paskambinta, išsiųstas el. laiškas.', (current_date - 2)::timestamptz),
  ('1c7d1e5b-cf13-4ed7-bb3a-9dbfbfe44855', 'Paskambinta, išsiųstas el. laiškas.', (current_date - 3)::timestamptz),
  ('58ebbb56-32f6-4d0e-87e8-13794c3dca16', 'Paskambinta, išsiųstas el. laiškas.', (current_date - 4)::timestamptz),
  ('58241300-e011-4aea-89ff-f16f9c68d98e', 'Paskambinta, išsiųstas el. laiškas.', (current_date - 5)::timestamptz),
  ('c9400873-f42a-4210-92aa-b12b3b808354', 'Paskambinta, išsiųstas el. laiškas.', (current_date - 6)::timestamptz);

-- One-off park events
insert into public.events (title, category, date, start_time, place, blurb, price, capacity, published) values
  ('Sezono uždarymo vakarėlis', 'sventes', current_date + 5, '18:00', 'Skoniai Marse', 'Paskutinis sezono vakaras prie trasos: DJ, laužas ir sezono vaizdo įrašai.', null, null, true),
  ('Vandenlenčių filmų vakaras', 'vakarai', current_date + 9, '19:30', 'Skoniai Marse', 'Geriausi kabelio ir boat filmai dideliame ekrane. Popkornas įskaičiuotas.', 8, null, true),
  ('Marso Akademija: žiemos treniruotės', 'akademija', current_date + 12, '11:00', 'Marso Akademija', 'Balanso lentos, batutas ir triukų technika sausumoje. Vaikams nuo 8 m. ir suaugusiems.', 20, null, true),
  ('Gyva muzika prie ežero', 'vakarai', current_date + 16, '20:00', 'Skoniai Marse', 'Akustinis vakaras su vietos atlikėjais. Staliukus verta rezervuoti iš anksto.', null, null, true),
  ('Rookie Challenge 2027: registracijos startas', 'akademija', current_date + 23, '12:00', 'Vanduo Marse', 'Pristatome kitų metų naujokų varžybas, taisykles ir treniruočių planą.', null, null, true),
  ('Kalėdinė mugė Marse', 'sventes', current_date + 27, '14:00', 'Vanduo Marse', 'Vietinių gamintojų mugė, karštas vynas ir dovanų kuponai su nuolaida.', null, null, true);

-- Public sauna sessions from the templates, 90 days ahead
insert into public.events (title, category, date, start_time, duration_minutes, place, blurb, price, capacity, published, template_id)
select t.title, 'pirtis', d::date, t.start_time, t.duration_minutes, 'Pirtis Marse · ' || t.host, t.blurb, t.price_per_person, t.capacity, true, t.id
from public.sauna_event_templates t
cross join generate_series(current_date, current_date + 89, interval '1 day') as d
where t.active and extract(dow from d)::smallint = t.weekday
on conflict (template_id, date) do nothing;

-- Tickets already sold for the next sessions
insert into public.event_tickets (event_id, customer_name, customer_email, people, total)
select e.id, 'Demo pirkėjas', 'demo@pastas.lt', v.people, e.price * v.people
from (values
  ('ritualas', current_date + 1, 2),
  ('saulelydis', current_date + 2, 5),
  ('rytas', current_date + 3, 8),
  ('ritualas', current_date + 8, 2),
  ('saulelydis', current_date + 9, 2),
  ('rytas', current_date + 10, 8),
  ('ritualas', current_date + 15, 7),
  ('saulelydis', current_date + 16, 7),
  ('ritualas', current_date + 22, 2),
  ('saulelydis', current_date + 23, 8),
  ('rytas', current_date + 24, 5),
  ('ritualas', current_date + 29, 6)
) as v(template_id, date, people)
join public.events e on e.template_id = v.template_id and e.date = v.date;

