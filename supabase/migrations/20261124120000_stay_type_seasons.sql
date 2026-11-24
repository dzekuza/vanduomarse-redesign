-- Seasonal prices for cabins and camper pitches (ADR-0126).
--
-- A stay type keeps its base prices (1 / 2 / 3+ nights, see 20261119100000_stay_night_tiers.sql). A
-- season is a date range with its own three prices: every night that falls inside it is priced from the
-- season, every other night from the base. Ranges of one type cannot overlap. The tier (1 / 2 / 3+)
-- still comes from the length of the whole stay.

create extension if not exists btree_gist with schema extensions;

create table public.stay_type_seasons (
  id uuid primary key default gen_random_uuid(),
  stay_type_id text not null references public.stay_types (id) on update cascade on delete cascade,
  starts_on date not null,
  ends_on date not null,
  price_per_night numeric(10, 2) not null check (price_per_night >= 0),
  price_per_night_2 numeric(10, 2) not null check (price_per_night_2 >= 0),
  price_per_night_3 numeric(10, 2) not null check (price_per_night_3 >= 0),
  created_at timestamptz not null default now(),
  constraint stay_type_seasons_range check (ends_on >= starts_on),
  constraint stay_type_seasons_no_overlap exclude using gist (
    stay_type_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);

comment on table public.stay_type_seasons is 'Date ranges (both ends inclusive) with their own per-night prices for a stay type; nights outside every range use the base prices on stay_types.';

create index stay_type_seasons_type_idx on public.stay_type_seasons (stay_type_id, starts_on);

alter table public.stay_type_seasons enable row level security;

-- Prices are public, like stay_types; only the owner changes them.
create policy "public read stay type seasons" on public.stay_type_seasons
  for select to anon, authenticated using (true);
create policy "owner stay type seasons insert" on public.stay_type_seasons
  for insert to authenticated with check ((select private.is_owner()));
create policy "owner stay type seasons update" on public.stay_type_seasons
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner stay type seasons delete" on public.stay_type_seasons
  for delete to authenticated using ((select private.is_owner()));

grant select on public.stay_type_seasons to anon, authenticated;
grant insert, update, delete on public.stay_type_seasons to authenticated;

-- Per-night price of the night `p_date` in a stay of `p_nights`. Mirrors stayNightRate() in lib/cabin.ts.
create function private.stay_night_rate(t public.stay_types, p_date date, p_nights integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case when p_nights >= 3 then coalesce(s.price_per_night_3, t.price_per_night_3)
              when p_nights = 2 then coalesce(s.price_per_night_2, t.price_per_night_2)
              else coalesce(s.price_per_night, t.price_per_night) end
  from (select 1) as one
  left join public.stay_type_seasons s
    on s.stay_type_id = t.id and p_date between s.starts_on and s.ends_on;
$$;

-- Price of one unit for a whole stay starting `p_date`: each night at its own season's rate.
-- Mirrors stayPrice() in lib/cabin.ts.
create function private.stay_price(t public.stay_types, p_date date, p_nights integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(private.stay_night_rate(t, p_date + n, p_nights)), 0)
  from generate_series(0, p_nights - 1) as n;
$$;

-- The two functions that price a stay on the server: re-create them from their live definition with
-- the seasonal price, so nothing else in them is touched.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.create_stay_booking_with_units(text,date,smallint,smallint,text,smallint,text,text,text,text,text)'::regprocedure) into v_def;
  if position('private.stay_night_price(t, p_nights) * p_nights * p_units' in v_def) = 0 then
    raise exception 'create_stay_booking_with_units: pricing expression not found';
  end if;
  execute replace(v_def, 'private.stay_night_price(t, p_nights) * p_nights * p_units', 'private.stay_price(t, p_date, p_nights) * p_units');

  select pg_get_functiondef('public.accept_inquiry_stays(uuid)'::regprocedure) into v_def;
  if position('private.stay_night_price(t, v_nights) * v_units * v_nights' in v_def) = 0 then
    raise exception 'accept_inquiry_stays: pricing expression not found';
  end if;
  execute replace(v_def, 'private.stay_night_price(t, v_nights) * v_units * v_nights', 'private.stay_price(t, i.date, v_nights) * v_units');
end;
$$;
