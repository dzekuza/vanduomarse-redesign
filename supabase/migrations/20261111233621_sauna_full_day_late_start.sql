-- Vanduo Marse: "Visa diena" can start later than the opening hour.
--
-- A full-day session started after 10:00 runs from the start to closing (e.g. 12:00-22:00 = 10 h) and bills
-- the full-day price (the 12 h key of the day's table). The booked length is the real number of hours, so
-- the overlap and turnaround rules work unchanged. A start at the opening hour is still p_hours = 12.
-- Only the price lookup changes; grants are kept by `create or replace`.

CREATE OR REPLACE FUNCTION public.create_sauna_booking(p_sauna_id text, p_date date, p_start_hour smallint, p_hours smallint, p_party smallint, p_extras jsonb, p_name text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_coupon text DEFAULT NULL::text, p_discount_code text DEFAULT NULL::text, p_master_id text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, reference text, total numeric, discount numeric, code_discount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_prices jsonb;
  v_price_key text := p_hours::text;
  v_longest integer;
  v_extra_min integer;
  m public.sauna_masters;
  v_master numeric := 0;
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

  v_prices := private.sauna_prices(s, p_date);
  select coalesce(max(u.min_hours), 0) into v_extra_min
  from jsonb_each(coalesce(p_extras, '{}'::jsonb)) e
  join public.sauna_upsells u on u.id = e.key and u.active
  join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = s.id
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  -- A named pirtininkas adds his own price and sets the shortest session.
  if p_master_id is not null then
    select * into m from public.sauna_masters where sauna_masters.id = p_master_id and active;
    if not found then
      raise exception 'Sauna master unavailable' using errcode = '23503', hint = 'master_unavailable';
    end if;
    v_extra_min := greatest(v_extra_min, m.min_hours);
    v_master := m.price;
  end if;

  if p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
  end if;
  -- "Visa diena" may start later than the opening hour: it then runs to closing, which is more than the
  -- longest hourly length but less than the full-day length, and bills the full-day price.
  if not (v_prices ? v_price_key) and v_prices ? '12' and p_start_hour + p_hours = s.close_hour then
    select max(k::integer) into v_longest from jsonb_object_keys(v_prices) k where k::integer < 12;
    if p_hours > coalesce(v_longest, 0) and p_hours < 12 then
      v_price_key := '12';
    end if;
  end if;
  if not (v_prices ? v_price_key) or p_hours < v_extra_min then
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

  v_base := (v_prices ->> v_price_key)::numeric + greatest(0, p_party - s.included_guests) * s.extra_guest_fee;

  perform pg_advisory_xact_lock(hashtext('sauna:' || s.id || ':' || p_date));
  if exists (
    select 1 from public.bookings b
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.sauna_id = s.id and b.date = p_date
      and b.start_hour < p_start_hour + p_hours + s.turnaround_hours
      and b.start_hour + b.hours + s.turnaround_hours > p_start_hour
  ) then
    raise exception 'Sauna hour is already booked' using errcode = '23P01', hint = 'sauna_booked';
  end if;

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

  v_subtotal := v_base + v_extras + v_master;

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);
  if v_code_id is not null then
    v_note := left(concat_ws(' · ', v_note, 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €'), 300);
  end if;

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

  if m.id is not null then
    insert into public.booking_extras (booking_id, upsell_id, name, unit, unit_price, quantity, line_total)
    values (v_id, null, left('Pirtininkas: ' || m.name, 120), 'rezervacijai', m.price, 1, m.price);
  end if;

  return query select v_id, v_ref, v_subtotal - v_code_discount - v_discount, v_discount, v_code_discount;
end;
$function$;
