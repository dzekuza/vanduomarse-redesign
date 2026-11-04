-- Each stay request can reserve several units of one type, with one reference.
alter table public.bookings
  add column stay_units smallint not null default 1,
  alter column guests drop not null,
  add constraint bookings_stay_units_shape
    check (stay_units > 0 and (kind <> 'pirtis' or stay_units = 1)),
  add constraint bookings_sauna_guests
    check (kind <> 'pirtis' or guests is not null);

comment on column public.bookings.stay_units is 'Cabins or camper pitches reserved by this request; one for legacy stays.';
comment on column public.bookings.guests is 'Number of people when provided. Required for sauna bookings.';

create or replace function public.enforce_stay_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_units smallint;
  v_full date;
begin
  if new.kind = 'pirtis' or new.status = 'atsaukta' then
    return new;
  end if;

  select t.units into v_units from public.stay_types t where t.id = new.stay_type_id;
  if v_units is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('stay:' || new.stay_type_id));

  select night::date into v_full
  from generate_series(new.date, new.date + new.nights - 1, interval '1 day') as night
  where (
    select coalesce(sum(b.stay_units), 0)
    from public.bookings b
    where b.stay_type_id = new.stay_type_id
      and b.status <> 'atsaukta'
      and b.id <> new.id
      and b.date <= night::date
      and night::date < b.date + b.nights
  ) + new.stay_units > v_units
  order by night
  limit 1;

  if found then
    raise exception 'Not enough % left for the night of %', new.stay_type_id, v_full
      using errcode = '23P01', hint = 'stay_full';
  end if;
  return new;
end;
$$;

drop trigger bookings_stay_capacity on public.bookings;
create trigger bookings_stay_capacity
  before insert or update of kind, date, nights, stay_type_id, stay_units, status on public.bookings
  for each row execute function public.enforce_stay_capacity();

create or replace function public.stay_occupancy(p_from date, p_to date)
returns table (day date, stay_type_id text, taken integer, units smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 370 then
    raise exception 'Range must be 0-370 days' using errcode = '22023';
  end if;

  return query
    select d::date, t.id, coalesce(sum(b.stay_units), 0)::integer, t.units
    from generate_series(p_from, p_to, interval '1 day') as d
    cross join public.stay_types t
    left join public.bookings b
      on b.stay_type_id = t.id
     and b.status <> 'atsaukta'
     and b.date <= d::date
     and d::date < b.date + b.nights
    where t.active
    group by d, t.id, t.units, t.sort_order
    order by d, t.sort_order;
end;
$$;

comment on function public.stay_occupancy is 'Reserved units per stay type per night (stock units null = unlimited).';

create function public.create_stay_booking_with_units(
  p_stay_type_id text,
  p_date date,
  p_nights smallint,
  p_units smallint,
  p_name text,
  p_guests smallint default null,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_coupon text default null
)
returns table (id uuid, reference text, total numeric, discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.stay_types;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_subtotal numeric;
  v_discount numeric := 0;
  v_code text := upper(regexp_replace(coalesce(p_coupon, ''), '[^A-Za-z0-9]', '', 'g'));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
  v_ref text;
begin
  select * into t from public.stay_types where stay_types.id = p_stay_type_id and active;
  if not found then
    raise exception 'Stay type unavailable' using errcode = '23503', hint = 'stay_unavailable';
  end if;
  -- Matches MAX_STAY_UNITS in lib/cabin.ts. Actual finite stock is checked on every night.
  if p_units is null or p_units < 1 or p_units > 20 then
    raise exception 'Invalid number of stay units' using errcode = '23514', hint = 'stay_units';
  end if;
  if p_guests is not null and (p_guests < 1 or p_guests > t.max_guests * p_units) then
    raise exception 'Invalid guest count for these units' using errcode = '23514', hint = 'stay_guests';
  end if;
  if p_nights is null or p_nights < 1 or p_nights > 14 then
    raise exception 'Invalid length of stay' using errcode = '23514', hint = 'stay_nights';
  end if;
  if p_date is null or p_date < v_now::date or p_date > v_now::date + 365 then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'stay_past';
  end if;

  if (select count(*) from public.bookings b
       where b.status = 'laukia' and b.source = 'svetaine' and b.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_subtotal := t.price_per_night * p_nights * p_units;

  if v_code <> '' then
    select least(v_subtotal, c.balance) into v_discount
    from public.coupons c
    where c.code = v_code and c.status = 'aktyvus' and c.balance > 0
      and (c.expires_at is null or c.expires_at >= v_now::date)
      and c.service in ('visi', 'miegas');
    if not found then
      raise exception 'Coupon not valid' using errcode = '23514', hint = 'coupon_invalid';
    end if;
    v_note := left(concat_ws(' · ', v_note, 'Kuponas ' || v_code || ' −' || v_discount || ' €'), 300);
  end if;

  insert into public.bookings (kind, customer_name, customer_email, customer_phone, date, nights, stay_type_id,
                               stay_units, guests, total, status, source, note)
  values (t.kind, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_nights, t.id, p_units, p_guests, v_subtotal - v_discount, 'laukia', 'svetaine', v_note)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, v_subtotal - v_discount, v_discount;
end;
$$;

revoke execute on function public.create_stay_booking_with_units(text, date, smallint, smallint, text, smallint, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_stay_booking_with_units(text, date, smallint, smallint, text, smallint, text, text, text, text)
  to anon, authenticated;

-- The standalone/embed forms still book one unit with a known guest count.
create or replace function public.create_stay_booking(
  p_stay_type_id text,
  p_date date,
  p_nights smallint,
  p_guests smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_coupon text default null
)
returns table (id uuid, reference text, total numeric, discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_guests is null then
    raise exception 'Guest count required' using errcode = '23514', hint = 'stay_guests';
  end if;
  return query select * from public.create_stay_booking_with_units(
    p_stay_type_id, p_date, p_nights, 1::smallint, p_name, p_guests, p_email, p_phone, p_note, p_coupon
  );
end;
$$;
