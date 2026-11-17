-- Sauna pricing by session length (the owner's sheet, 2026-11-11).
--
-- * Each sauna has a price per length, one table for weekdays (Mon-Thu) and one for Fri-Sun
--   (`weekday_prices` / `weekend_prices`: { "<hours>": price }). The lengths in a table are the
--   lengths on offer, so the smallest key is that day's minimum.
-- * The price covers `included_guests` people; each guest above costs `extra_guest_fee` once.
-- * `sauna_upsells.min_hours`: an extra that raises the minimum session (the sauna master: 3 h).
--   The master is the `pirtininkas` extra (250 EUR per booking).
-- * `turnaround_hours` stay free between two sessions of the same sauna.
-- The old hourly-by-group-size and package columns are no longer used and may be null; `min_hours` /
-- `max_hours` stay as the shortest / longest length across both tables (kept by the app).

alter table public.saunas
  add column weekday_prices jsonb not null default '{}'::jsonb check (jsonb_typeof(weekday_prices) = 'object'),
  add column weekend_prices jsonb not null default '{}'::jsonb check (jsonb_typeof(weekend_prices) = 'object'),
  add column included_guests smallint not null default 10 check (included_guests between 1 and 100),
  add column extra_guest_fee numeric(10, 2) not null default 15 check (extra_guest_fee between 0 and 100000),
  add column turnaround_hours smallint not null default 1 check (turnaround_hours between 0 and 6);

alter table public.saunas
  alter column small_group_max drop not null,
  alter column small_group_rate drop not null,
  alter column large_group_rate drop not null,
  alter column package_hours drop not null,
  alter column package_price drop not null;

update public.saunas set
  weekday_prices = '{"2": 160, "3": 220, "4": 240}'::jsonb,
  weekend_prices = '{"3": 250, "4": 320}'::jsonb,
  included_guests = 10,
  extra_guest_fee = 15,
  turnaround_hours = 1,
  min_hours = 2,
  max_hours = 4,
  small_group_max = null, small_group_rate = null, large_group_rate = null, package_hours = null, package_price = null;

comment on column public.saunas.weekday_prices is 'Price per session length Mon-Thu, e.g. {"2": 160, "3": 220}; the keys are the lengths on offer.';
comment on column public.saunas.weekend_prices is 'Price per session length Fri-Sun; same shape as weekday_prices.';
comment on column public.saunas.turnaround_hours is 'Hours kept free before and after each session of this sauna.';

alter table public.sauna_upsells add column min_hours smallint check (min_hours is null or min_hours between 1 and 12);
comment on column public.sauna_upsells.min_hours is 'Picking this extra raises the minimum session length to this many hours.';

insert into public.sauna_upsells (id, name, description, price, unit, max_qty, active, sort_order, min_hours)
values ('pirtininkas', 'Pirtininkas', 'Profesionalus pirtininkas: garai, vanojimas ir ritualas. Minimali trukmė 3 val.', 250, 'rezervacijai', null, true, 0, 3)
on conflict (id) do update set min_hours = excluded.min_hours;

insert into public.sauna_upsell_links (sauna_id, upsell_id)
select s.id, 'pirtininkas' from public.saunas s
on conflict do nothing;

-- Fri-Sun use the weekend table (ISO weekday 5-7).
create function private.sauna_prices(s public.saunas, p_date date)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case when extract(isodow from p_date) >= 5 then s.weekend_prices else s.weekday_prices end;
$$;

CREATE OR REPLACE FUNCTION public.create_sauna_booking(p_sauna_id text, p_date date, p_start_hour smallint, p_hours smallint, p_party smallint, p_extras jsonb, p_name text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_coupon text DEFAULT NULL::text, p_discount_code text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, reference text, total numeric, discount numeric, code_discount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_prices jsonb;
  v_extra_min integer;
  v_base numeric;
  v_extras numeric;
  v_requested integer;
  v_matched integer;
  v_subtotal numeric;
  v_discount numeric := 0;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_code text := upper(regexp_replace(coalesce(p_coupon, ''), '[^A-Za-z0-9]', '', 'g'));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
  v_ref text;
begin
  select * into s from public.saunas where saunas.id = p_sauna_id and active;
  if not found then
    raise exception 'Sauna unavailable' using errcode = '23503', hint = 'sauna_unavailable';
  end if;

  -- Lengths on offer depend on the day (Fri-Sun has its own table); an extra such as the sauna master
  -- can raise the minimum (sauna_upsells.min_hours).
  v_prices := private.sauna_prices(s, p_date);
  select coalesce(max(u.min_hours), 0) into v_extra_min
  from jsonb_each(coalesce(p_extras, '{}'::jsonb)) e
  join public.sauna_upsells u on u.id = e.key and u.active
  join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = s.id
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  if p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
  end if;
  if not (v_prices ? p_hours::text) or p_hours < v_extra_min then
    raise exception 'Session length not offered' using errcode = '23514', hint = 'sauna_duration';
  end if;
  if p_party < 1 or p_party > s.max_party then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'sauna_party';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'sauna_past';
  end if;

  if (select count(*) from public.bookings b
       where b.status = 'laukia' and b.source = 'svetaine' and b.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  -- Session price: the fixed price of the chosen length, plus a fee per guest above the included number.
  v_base := (v_prices ->> p_hours::text)::numeric + greatest(0, p_party - s.included_guests) * s.extra_guest_fee;

  -- The sauna needs `turnaround_hours` free before and after a session (cleaning and heating).
  perform pg_advisory_xact_lock(hashtext('sauna:' || s.id || ':' || p_date));
  if exists (
    select 1 from public.bookings b
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.sauna_id = s.id and b.date = p_date
      and b.start_hour < p_start_hour + p_hours + s.turnaround_hours
      and b.start_hour + b.hours + s.turnaround_hours > p_start_hour
  ) then
    raise exception 'Sauna hour is already booked' using errcode = '23P01', hint = 'sauna_booked';
  end if;

  -- Extras: { "<upsell id>": quantity }. Unknown, inactive or not offered by this sauna rejects the request.
  select count(*) into v_requested
  from jsonb_each(coalesce(p_extras, '{}'::jsonb)) e
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  select count(*), coalesce(sum(
           case u.unit
             when 'rezervacijai' then u.price
             when 'asmeniui' then u.price * p_party
             when 'valandai' then u.price * p_hours
             else u.price * least((e.value #>> '{}')::integer, coalesce(u.max_qty, p_party))
           end), 0)
    into v_matched, v_extras
  from jsonb_each(coalesce(p_extras, '{}'::jsonb)) e
  join public.sauna_upsells u on u.id = e.key and u.active
  join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = s.id
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  if v_matched <> v_requested then
    raise exception 'Extra unavailable' using errcode = '23503', hint = 'extra_unavailable';
  end if;

  v_subtotal := v_base + v_extras;

  -- The discount code comes off the subtotal first.
  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);
  if v_code_id is not null then
    v_note := left(concat_ws(' · ', v_note, 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €'), 300);
  end if;

  -- A coupon is validated and shown to staff, who redeem it in /admin/kuponai.
  if v_code <> '' then
    select least(v_subtotal - v_code_discount, c.balance) into v_discount
    from public.coupons c
    where c.code = v_code and c.status = 'aktyvus' and c.balance > 0
      and (c.expires_at is null or c.expires_at >= v_now::date)
      and c.service in ('visi', 'pirtis');
    if not found then
      raise exception 'Coupon not valid' using errcode = '23514', hint = 'coupon_invalid';
    end if;
    v_note := left(concat_ws(' · ', v_note, 'Kuponas ' || v_code || ' −' || v_discount || ' €'), 300);
  end if;

  insert into public.bookings (kind, sauna_id, customer_name, customer_email, customer_phone, date, start_hour, hours,
                               guests, total, status, source, note, discount_code_id, discount_code, discount_amount)
  values ('pirtis', s.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, p_hours, p_party, v_subtotal - v_code_discount - v_discount, 'laukia', 'svetaine', v_note,
          v_code_id, v_code_text, v_code_discount)
  returning bookings.id, bookings.reference into v_id, v_ref;

  insert into public.booking_extras (booking_id, upsell_id, name, unit, unit_price, quantity, line_total)
  select v_id, u.id, u.name, u.unit, u.price,
         case u.unit
           when 'asmeniui' then p_party
           when 'valandai' then p_hours
           when 'vienetui' then least((e.value #>> '{}')::integer, coalesce(u.max_qty, p_party))
           else 1
         end::smallint,
         case u.unit
           when 'rezervacijai' then u.price
           when 'asmeniui' then u.price * p_party
           when 'valandai' then u.price * p_hours
           else u.price * least((e.value #>> '{}')::integer, coalesce(u.max_qty, p_party))
         end
  from jsonb_each(coalesce(p_extras, '{}'::jsonb)) e
  join public.sauna_upsells u on u.id = e.key and u.active
  join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = s.id
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  return query select v_id, v_ref, v_subtotal - v_code_discount - v_discount, v_discount, v_code_discount;
end;
$function$;

CREATE OR REPLACE FUNCTION public.accept_inquiry_stays(p_inquiry_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  i public.inquiries;
  t public.stay_types;
  v_key text;
  v_count text;
  v_units integer;
  v_nights integer;
  v_made integer := 0;
  sa public.saunas;
  v_pick jsonb;
  v_hours integer;
  v_start integer;
  v_party integer;
  v_billable integer;
  v_price numeric;
  pr public.sauna_programs;
  v_program text;
  v_booking uuid;
begin
  if not ((select private.has_permission('uzklausos')) and (select private.has_permission('rezervacijos'))) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select * into i from public.inquiries where id = p_inquiry_id for update;
  if not found then
    raise exception 'Inquiry not found' using errcode = '23503', hint = 'inquiry_missing';
  end if;
  if i.accepted_at is not null then
    raise exception 'Inquiry already accepted' using errcode = '23514', hint = 'inquiry_accepted';
  end if;
  if i.date is null then
    raise exception 'Inquiry has no date' using errcode = '23514', hint = 'inquiry_no_date';
  end if;

  v_nights := case
    when coalesce(i.calculator_input ->> 'cabinNights', '') ~ '^\d{1,2}$' then (i.calculator_input ->> 'cabinNights')::integer
    else 1
  end;
  if v_nights < 1 or v_nights > 14 then
    raise exception 'Invalid length of stay' using errcode = '23514', hint = 'stay_nights';
  end if;

  for v_key, v_count in
    select e.key, e.value from jsonb_each_text(coalesce(i.calculator_input -> 'cabinUnits', '{}'::jsonb)) as e
  loop
    if v_count !~ '^\d{1,3}$' or v_count::integer = 0 then
      continue;
    end if;
    v_units := v_count::integer;

    select * into t from public.stay_types
    where kind = 'namelis' and (id = v_key or id = 'namelis-' || v_key)
    order by (id = v_key) desc
    limit 1;
    if not found then
      raise exception 'Unknown stay type %', v_key using errcode = '23514', hint = 'stay_type_missing';
    end if;

    insert into public.bookings (
      reference, kind, customer_name, customer_email, customer_phone, date, nights,
      stay_type_id, stay_units, guests, total, status, source, note, inquiry_id
    ) values (
      null, 'namelis', i.customer_name, i.customer_email, i.customer_phone, i.date, v_nights,
      t.id, v_units, greatest(1, least(i.guests, v_units * t.max_guests)),
      t.price_per_night * v_units * v_nights, 'patvirtinta', 'telefonu',
      left('Skaičiuoklės užklausa: ' || i.event_type, 300), i.id
    );
    v_made := v_made + 1;
  end loop;

  for v_key, v_pick in
    select e.key, e.value from jsonb_each(coalesce(i.calculator_input -> 'saunas', '{}'::jsonb)) as e
  loop
    if jsonb_typeof(v_pick) <> 'object'
       or coalesce(v_pick ->> 'hours', '') !~ '^\d{1,2}$'
       or coalesce(v_pick ->> 'startHour', '') !~ '^\d{1,2}$' then
      continue;
    end if;
    v_hours := (v_pick ->> 'hours')::integer;
    v_start := (v_pick ->> 'startHour')::integer;
    if v_hours < 1 then
      continue;
    end if;

    select * into sa from public.saunas where id = v_key;
    if not found then
      raise exception 'Unknown sauna %', v_key using errcode = '23514', hint = 'sauna_missing';
    end if;
    v_program := nullif(v_pick ->> 'programId', '');
    pr := null;
    if v_program is not null then
      select * into pr from public.sauna_programs
      where id = v_program and active and kind = 'private' and sauna_id = sa.id;
      if not found then
        raise exception 'Unknown sauna program %', v_program using errcode = '23514', hint = 'program_missing';
      end if;
      v_hours := ceil(pr.duration_minutes / 60.0)::integer;
    end if;

    -- A quote line for a length the day does not offer is billed (and held) as the next length up.
    if pr.id is null then
      select min(k::integer) into v_billable from jsonb_object_keys(private.sauna_prices(sa, i.date)) k where k::integer >= v_hours;
      v_hours := coalesce(v_billable, 0);
    end if;
    if (pr.id is null and v_hours = 0) or v_start < sa.open_hour or v_start + v_hours > sa.close_hour then
      raise exception 'Session is outside the sauna''s hours' using errcode = '23514', hint = 'sauna_hours';
    end if;
    v_party := greatest(1, least(i.guests, sa.max_party));
    if pr.id is not null then
      v_price := case when pr.pricing = 'group' then pr.price else pr.price * i.guests end;
    else
      v_price := (private.sauna_prices(sa, i.date) ->> v_hours::text)::numeric
                 + greatest(0, i.guests - sa.included_guests) * sa.extra_guest_fee;
    end if;

    insert into public.bookings (
      reference, kind, sauna_id, program_id, customer_name, customer_email, customer_phone, date, start_hour, hours,
      guests, total, status, source, note, inquiry_id
    ) values (
      null, 'pirtis', sa.id, pr.id, i.customer_name, i.customer_email, i.customer_phone, i.date, v_start, v_hours,
      v_party, v_price,
      'patvirtinta', 'telefonu',
      left('Skaičiuoklės užklausa: ' || i.event_type, 300), i.id
    )
    returning id into v_booking;

    insert into public.booking_extras (booking_id, upsell_id, name, unit, unit_price, quantity, line_total)
    select v_booking, u.id, u.name, u.unit, u.price,
           case u.unit
             when 'asmeniui' then least(i.guests, 32000)
             when 'valandai' then v_hours
             when 'vienetui' then least(floor((e.value #>> '{}')::numeric)::integer, coalesce(u.max_qty, i.guests))
             else 1
           end::smallint,
           case u.unit
             when 'rezervacijai' then u.price
             when 'asmeniui' then u.price * i.guests
             when 'valandai' then u.price * v_hours
             else u.price * least(floor((e.value #>> '{}')::numeric)::integer, coalesce(u.max_qty, i.guests))
           end
    from jsonb_each(coalesce(v_pick -> 'extras', '{}'::jsonb)) e
    join public.sauna_upsells u on u.id = e.key and u.active
    join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = sa.id
    where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

    update public.bookings
    set total = total + coalesce((select sum(x.line_total) from public.booking_extras x where x.booking_id = v_booking), 0)
    where id = v_booking;

    v_made := v_made + 1;
  end loop;

  if v_made = 0 then
    raise exception 'Inquiry has nothing to hold' using errcode = '23514', hint = 'no_stays';
  end if;

  update public.inquiries set accepted_at = now() where id = i.id;
  return v_made;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sauna_taken(p_from date, p_to date)
 RETURNS TABLE(sauna_id text, day date, hour smallint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_to < p_from or p_to - p_from > 370 then
    raise exception 'Range must be 0-370 days' using errcode = '22023';
  end if;

  return query
    select b.sauna_id, b.date, h::smallint
    from public.bookings b
    join public.saunas sa on sa.id = b.sauna_id
    cross join lateral generate_series(
      greatest(0, b.start_hour - sa.turnaround_hours),
      least(23, b.start_hour + b.hours - 1 + sa.turnaround_hours)
    ) as h
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date between p_from and p_to
    union
    select s.sauna_id, s.date, s.hour
    from public.sauna_blocks s
    where s.date between p_from and p_to
    union
    select 'pirtis-marse'::text, occupied.hour_start::date, extract(hour from occupied.hour_start)::smallint
    from private.published_sauna_slots(p_from, p_to) as session(slot)
    cross join lateral generate_series(
      greatest(date_trunc('hour', lower(session.slot)), p_from::timestamp),
      least(date_trunc('hour', upper(session.slot) - interval '1 microsecond'), p_to + interval '23 hours'),
      interval '1 hour'
    ) as occupied(hour_start)
    order by 1, 2, 3;
end;
$function$;

