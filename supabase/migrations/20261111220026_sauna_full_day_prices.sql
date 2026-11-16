-- Sauna price sheet incl. "Visa diena" (owner's sheet, 2026-11-12).
--
-- Each length is a key in the day type's price table; 12 = the whole opening day (10:00-22:00),
-- labelled "Visa diena" in the app. Prices incl. 21% PVM, for the whole sauna (up to 10 guests).
--   Mon-Thu: 2 h 160, 3 h 210, 4 h 240, day 300
--   Fri-Sun: 2 h 200, 3 h 270, 4 h 320, day 400
-- `max_hours` is the longest length across both tables (12), which the app uses to cap a run.
-- `create_sauna_booking` already accepts any length that is a key in the day's table and fits opening hours.

update public.saunas set
  weekday_prices = '{"2": 160, "3": 210, "4": 240, "12": 300}'::jsonb,
  weekend_prices = '{"2": 200, "3": 270, "4": 320, "12": 400}'::jsonb,
  min_hours = 2,
  max_hours = 12
where id in ('pirtis-marse', 'suomiska-sauna');
