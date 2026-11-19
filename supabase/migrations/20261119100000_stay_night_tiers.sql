-- Cabin / pitch prices by length of stay (the owner edits them at /admin/namukai).
--
-- `price_per_night` stays the price of a 1-night stay. Two new columns hold the per-night price
-- when the stay is exactly 2 nights and when it is 3 or more. The rate of the whole stay's length
-- applies to every night (e.g. 100 / 80 / 60: 1 night = 100, 2 nights = 2 x 80, 4 nights = 4 x 60).
-- Existing rows keep their single price for all lengths.

alter table public.stay_types
  add column price_per_night_2 numeric(10, 2),
  add column price_per_night_3 numeric(10, 2);

update public.stay_types
set price_per_night_2 = price_per_night, price_per_night_3 = price_per_night;

alter table public.stay_types
  alter column price_per_night_2 set not null,
  alter column price_per_night_3 set not null,
  add constraint stay_types_price_per_night_2_check check (price_per_night_2 >= 0),
  add constraint stay_types_price_per_night_3_check check (price_per_night_3 >= 0);

comment on column public.stay_types.price_per_night is 'EUR incl. PVM per night for a 1-night stay.';
comment on column public.stay_types.price_per_night_2 is 'EUR incl. PVM per night when the stay is 2 nights.';
comment on column public.stay_types.price_per_night_3 is 'EUR incl. PVM per night when the stay is 3 or more nights.';

-- Per-night price for a stay of p_nights. Mirrors stayNightRate() in lib/cabin.ts.
create function private.stay_night_price(t public.stay_types, p_nights integer)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when p_nights >= 3 then t.price_per_night_3
              when p_nights = 2 then t.price_per_night_2
              else t.price_per_night end;
$$;

-- The two functions that price a stay on the server: re-create them from their live definition with
-- the tiered rate, so nothing else in them is touched.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.create_stay_booking_with_units(text,date,smallint,smallint,text,smallint,text,text,text,text,text)'::regprocedure) into v_def;
  if position('t.price_per_night * p_nights * p_units' in v_def) = 0 then
    raise exception 'create_stay_booking_with_units: pricing expression not found';
  end if;
  execute replace(v_def, 't.price_per_night * p_nights * p_units', 'private.stay_night_price(t, p_nights) * p_nights * p_units');

  select pg_get_functiondef('public.accept_inquiry_stays(uuid)'::regprocedure) into v_def;
  if position('t.price_per_night * v_units * v_nights' in v_def) = 0 then
    raise exception 'accept_inquiry_stays: pricing expression not found';
  end if;
  execute replace(v_def, 't.price_per_night * v_units * v_nights', 'private.stay_night_price(t, v_nights) * v_units * v_nights');
end;
$$;
