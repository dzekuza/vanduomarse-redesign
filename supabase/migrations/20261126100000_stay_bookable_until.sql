-- "Rezervuoti galima iki" per stay type (ADR-0127).
--
-- `stay_types.bookable_until` is EXCLUSIVE: the last night that can be booked on the website is the day before,
-- and check-out may fall on it. 2027-05-01 = the last night is 30 April. Null = no limit (only the 350-day window).
-- Only website requests (source 'svetaine') are refused; staff may still book any date by phone.
-- Additive: a new nullable column, a new trigger, and save_stay_type re-created so it keeps the stored value when the
-- caller (an older app build) does not send the key.

alter table public.stay_types add column bookable_until date;

comment on column public.stay_types.bookable_until is 'Exclusive: the website cannot sell a night on or after this date (check-out on it is fine). Null = no limit.';

create function private.enforce_stay_bookable_until()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_until date;
begin
  if new.kind = 'pirtis' or new.source <> 'svetaine' or new.stay_type_id is null then
    return new;
  end if;
  select t.bookable_until into v_until from public.stay_types t where t.id = new.stay_type_id;
  if v_until is not null and new.date + new.nights > v_until then
    raise exception 'Stay type % can only be booked until %', new.stay_type_id, v_until
      using errcode = 'P0001', hint = 'stay_closed';
  end if;
  return new;
end;
$$;

create trigger bookings_stay_bookable_until
  before insert on public.bookings
  for each row execute function private.enforce_stay_bookable_until();

-- save_stay_type with the new key. A caller that does not send `bookable_until` keeps the stored value.
create or replace function public.save_stay_type(p_type jsonb, p_seasons jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id text := p_type ->> 'id';
  v_has_until boolean := p_type ? 'bookable_until';
begin
  insert into public.stay_types (id, kind, label, note, max_guests, price_per_night, price_per_night_2, price_per_night_3, units, active, sort_order, bookable_until)
  values (
    v_id,
    (p_type ->> 'kind')::public.booking_kind,
    p_type ->> 'label',
    coalesce(p_type ->> 'note', ''),
    (p_type ->> 'max_guests')::integer,
    (p_type ->> 'price_per_night')::numeric,
    (p_type ->> 'price_per_night_2')::numeric,
    (p_type ->> 'price_per_night_3')::numeric,
    (p_type ->> 'units')::integer,
    (p_type ->> 'active')::boolean,
    (p_type ->> 'sort_order')::integer,
    (p_type ->> 'bookable_until')::date
  )
  on conflict (id) do update set
    kind = excluded.kind,
    label = excluded.label,
    note = excluded.note,
    max_guests = excluded.max_guests,
    price_per_night = excluded.price_per_night,
    price_per_night_2 = excluded.price_per_night_2,
    price_per_night_3 = excluded.price_per_night_3,
    units = excluded.units,
    active = excluded.active,
    sort_order = excluded.sort_order,
    bookable_until = case when v_has_until then excluded.bookable_until else public.stay_types.bookable_until end,
    updated_at = now();

  -- Replace the whole set: no overlap can appear halfway through.
  delete from public.stay_type_seasons where stay_type_id = v_id;
  insert into public.stay_type_seasons (id, stay_type_id, starts_on, ends_on, price_per_night, price_per_night_2, price_per_night_3)
  select x.id, v_id, x.starts_on, x.ends_on, x.price_per_night, x.price_per_night_2, x.price_per_night_3
  from jsonb_to_recordset(coalesce(p_seasons, '[]'::jsonb)) as x(
    id uuid, starts_on date, ends_on date, price_per_night numeric, price_per_night_2 numeric, price_per_night_3 numeric
  );
end;
$$;

-- Nested seasons (ADR-0128): a night inside several seasons takes the SHORTEST one (the most specific, e.g. Christmas
-- inside the winter season); a tie goes to the later start. While the old no-overlap constraint is in place a night
-- matches at most one season, so this changes nothing until 20261126110000 is applied. Mirrors seasonOn() in lib/cabin.ts.
create or replace function private.stay_night_rate(t public.stay_types, p_date date, p_nights integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case when p_nights >= 3 then coalesce(s.price_per_night_3, t.price_per_night_3)
              when p_nights = 2 then coalesce(s.price_per_night_2, t.price_per_night_2)
              else coalesce(s.price_per_night, t.price_per_night) end
  from (select 1) as one
  left join lateral (
    select x.price_per_night, x.price_per_night_2, x.price_per_night_3
    from public.stay_type_seasons x
    where x.stay_type_id = t.id and p_date between x.starts_on and x.ends_on
    order by x.ends_on - x.starts_on, x.starts_on desc
    limit 1
  ) as s on true;
$$;
