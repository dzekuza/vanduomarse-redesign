-- Vanduo Marse: reference data the site needs in every environment.
-- Generated from lib/ (sauna.ts, sauna-upsells.ts, cabin.ts, sauna-events.ts,
-- admin/mock-data.ts seedPrices) on 2026-10-22. From here on the
-- database is the source of truth; edit prices in /admin, not in lib/.

insert into public.sauna_settings (id, small_group_max, small_group_rate, large_group_rate, max_party, min_hours, max_hours, package_hours, package_price, open_hour, close_hour)
values (true, 6, 70, 100, 20, 2, 6, 4, 350, 10, 22);

insert into public.sauna_upsells (id, name, description, price, unit, max_qty, active, sort_order) values
  ('pirtininkas', 'Pirtininkas', 'Veda seansą: vantos, aromatai, garų ratai.', 100, 'rezervacijai', null, true, 0),
  ('vantos', 'Beržinė vanta', 'Šviežia vanta pirčiai.', 5, 'vienetui', null, true, 1),
  ('ranksluostis', 'Rankšluostis', 'Didelis pirties rankšluostis.', 5, 'vienetui', null, true, 2);

insert into public.stay_types (id, kind, label, note, max_guests, price_per_night, units, sort_order) values
  ('namelis-2', 'namelis', 'Namelis 2 asmenims', '', 2, 50, 8, 0),
  ('namelis-4', 'namelis', 'Namelis 4 asmenims', '', 4, 60, 6, 1),
  ('kemperis', 'kemperis', 'Kemperio aikštelė', 'su elektra', 6, 25, null, 2);

insert into public.sauna_event_templates (id, title, host, weekday, start_time, duration_minutes, price_per_person, capacity, blurb) values
  ('rytas', 'Rytinis maudynių klubas', 'atvira grupė', 0, '09:00', 60, 15, 8, 'Trumpi garai ir šaltas ežeras prieš pusryčius.'),
  ('ritualas', 'Pirties ritualas', 'su pirtininku', 5, '19:00', 120, 25, 8, 'Trys garų ratai su vantomis, aromatais ir šaltu ežeru tarp jų.'),
  ('saulelydis', 'Saulėlydžio garai', 'atvira grupė', 6, '20:00', 90, 20, 8, 'Kaitinamės, kol saulė leidžiasi už trasos. Arbata po seanso.');

insert into public.price_items (id, "group", label, unit, value, max, sort_order) values
  ('terasa-20-wd', 'Erdvės', 'Terasa iki 20 asm., darbo d.', 'min. sąsk. €', 600, null, 0),
  ('terasa-20-we', 'Erdvės', 'Terasa iki 20 asm., vakaras / savaitg.', 'min. sąsk. €', 700, null, 1),
  ('terasa-25-wd', 'Erdvės', 'Terasa iki 25 asm., darbo d.', 'min. sąsk. €', 900, null, 2),
  ('terasa-25-we', 'Erdvės', 'Terasa iki 25 asm., vakaras / savaitg.', 'min. sąsk. €', 1000, null, 3),
  ('terasa-30-wd', 'Erdvės', 'Terasa iki 30 asm., darbo d.', 'min. sąsk. €', 1100, null, 4),
  ('terasa-30-we', 'Erdvės', 'Terasa iki 30 asm., vakaras / savaitg.', 'min. sąsk. €', 1200, null, 5),
  ('kupolas-svente', 'Erdvės', 'Kupolas: šventė', '€', 700, null, 6),
  ('kupolas-seminaras', 'Erdvės', 'Kupolas: seminaras', '€', 363, null, 7),
  ('kupolas-corona', 'Erdvės', 'Kupolas + „Corona“', '€', 1900, null, 8),
  ('kupolas-corona-min', 'Erdvės', 'Kupolas + „Corona“: min. sąskaita', '€', 1500, null, 9),
  ('corona', 'Erdvės', '„Corona“ su baseinu', '€', 1200, null, 10),
  ('corona-min', 'Erdvės', '„Corona“ su baseinu: min. sąskaita', '€', 1500, null, 11),
  ('restoranas', 'Erdvės', 'Restoranas + terasa', '€', 500, null, 12),
  ('restoranas-min', 'Erdvės', 'Restoranas + terasa: min. sąskaita', '€', 1500, null, 13),
  ('parkas-wd', 'Erdvės', 'Visas parkas (be WAKE), darbo d.', '€', 6000, null, 14),
  ('parkas-we', 'Erdvės', 'Visas parkas (be WAKE), savaitgalis', '€', 7000, null, 15),
  ('parkas-wake-wd', 'Erdvės', 'Visas parkas su WAKE, darbo d.', '€', 9000, null, 16),
  ('parkas-wake-we', 'Erdvės', 'Visas parkas su WAKE, savaitgalis', '€', 10000, null, 17),
  ('cat-bufetas-20', 'Maitinimas', 'Švediškas stalas, 1 paketas (2 karštieji)', '€/asm.', 20, null, 18),
  ('cat-bufetas-25', 'Maitinimas', 'Švediškas stalas, 2 paketas (2 karštieji)', '€/asm.', 25, null, 19),
  ('cat-bufetas-30', 'Maitinimas', 'Švediškas stalas, 3 paketas (3 karštieji)', '€/asm.', 30, null, 20),
  ('cat-bufetas-35', 'Maitinimas', 'Švediškas stalas, 4 paketas (3 karštieji)', '€/asm.', 35, null, 21),
  ('cat-marmitai', 'Maitinimas', 'Pietūs marmituose', '€/asm.', 12, null, 22),
  ('drink-keg', 'Maitinimas', 'Alaus statinė 30 l', '€', 351, 424, 23),
  ('drink-wine', 'Maitinimas', 'Namų vynas, butelis', '€', 29, 33, 24),
  ('drink-sparkling', 'Maitinimas', 'Putojantis vynas, butelis', '€', 33, 42, 25),
  ('drink-cocktail', 'Maitinimas', 'Kokteilis', '€', 8, 11, 26),
  ('drink-juice', 'Maitinimas', 'Sultys, grafinas', '€', 12, null, 27),
  ('bartender', 'Paslaugos', 'Barmenas', '€/vakarui', 120, null, 28),
  ('decor', 'Paslaugos', 'Stalo dekoravimas', '€', 150, 250, 29),
  ('serving', 'Paslaugos', 'Serviravimas', '€/asm.', 7, null, 30),
  ('team', 'Paslaugos', 'Aptarnavimo mokestis', '€', 100, 350, 31),
  ('overtime', 'Paslaugos', 'Viršvalandžiai po 24:00', '€/val.', 150, null, 32),
  ('wake-private', 'Pramogos', 'Privati WAKE trasa, 2 val.', '€', 1694, null, 33),
  ('wake-rider', 'Pramogos', 'WAKE plaukimas', '€/asm.', 20, null, 34),
  ('atv', 'Pramogos', 'Keturračių turas', '€/asm.', 72, null, 35),
  ('cabin-night', 'Nakvynė', 'Nameliai', '€/asm./naktis', 50, 60, 36),
  ('room-namelis', 'Nakvynė', 'Namelis (svetainės rezervacija)', '€/naktis', 50, null, 37),
  ('room-kemperis', 'Nakvynė', 'Kemperio aikštelė (svetainės rezervacija)', '€/naktis', 25, null, 38);
