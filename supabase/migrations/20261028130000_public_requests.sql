-- Vanduo Marse: public requests that used to stay in the browser.
-- Private sauna hire, cabin / camper stays, event tickets, event registrations
-- and calculator inquiries are now stored, so staff see them in /admin.
-- Same pattern as create_quad_rental(): anon only calls security definer
-- functions; price, limits and availability come from the database rows, never
-- from the caller. Everything lands as 'laukia' (or 'nauja') for staff to confirm.

-- ---------------------------------------------------------------------------
-- Private sauna hire
-- ---------------------------------------------------------------------------

create function public.create_sauna_booking(
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_party smallint,
  p_extras jsonb,
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
declare
  s public.sauna_settings;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_rate numeric;
  v_hourly numeric;
  v_base numeric;
  v_extras numeric;
  v_requested integer;
  v_matched integer;
  v_subtotal numeric;
  v_discount numeric := 0;
  v_code text := upper(regexp_replace(coalesce(p_coupon, ''), '[^A-Za-z0-9]', '', 'g'));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
  v_ref text;
begin
  select * into s from public.sauna_settings;

  if p_hours < s.min_hours or p_hours > s.max_hours or p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
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

  -- Session price: hourly by group size; the package applies when it is cheaper.
  v_rate := case when p_party <= s.small_group_max then s.small_group_rate else s.large_group_rate end;
  v_hourly := p_hours * v_rate;
  v_base := case when p_hours = s.package_hours then least(v_hourly, s.package_price) else v_hourly end;

  -- Extras: { "<upsell id>": quantity }. Unknown or inactive ids reject the request.
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
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  if v_matched <> v_requested then
    raise exception 'Extra unavailable' using errcode = '23503', hint = 'extra_unavailable';
  end if;

  v_subtotal := v_base + v_extras;

  -- A coupon is validated and shown to staff, who redeem it in /admin/kuponai.
  if v_code <> '' then
    select least(v_subtotal, c.balance) into v_discount
    from public.coupons c
    where c.code = v_code and c.status = 'aktyvus' and c.balance > 0
      and (c.expires_at is null or c.expires_at >= v_now::date)
      and c.service in ('visi', 'pirtis');
    if not found then
      raise exception 'Coupon not valid' using errcode = '23514', hint = 'coupon_invalid';
    end if;
    v_note := left(concat_ws(' · ', v_note, 'Kuponas ' || v_code || ' −' || v_discount || ' €'), 300);
  end if;

  insert into public.bookings (kind, customer_name, customer_email, customer_phone, date, start_hour, hours,
                               guests, total, status, source, note)
  values ('pirtis', btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, p_hours, p_party, v_subtotal - v_discount, 'laukia', 'svetaine', v_note)
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
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  return query select v_id, v_ref, v_subtotal - v_discount, v_discount;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cabin and camper stays
-- ---------------------------------------------------------------------------

create function public.create_stay_booking(
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
  if p_guests < 1 or p_guests > t.max_guests then
    raise exception 'Too many guests' using errcode = '23514', hint = 'stay_guests';
  end if;
  if p_nights < 1 or p_nights > 14 then
    raise exception 'Invalid length of stay' using errcode = '23514', hint = 'stay_nights';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 365 then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'stay_past';
  end if;

  if (select count(*) from public.bookings b
       where b.status = 'laukia' and b.source = 'svetaine' and b.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_subtotal := t.price_per_night * p_nights;

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

  -- The stay capacity trigger raises 23P01 / stay_full when every unit is taken.
  insert into public.bookings (kind, customer_name, customer_email, customer_phone, date, nights, stay_type_id,
                               guests, total, status, source, note)
  values (t.kind, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_nights, t.id, p_guests, v_subtotal - v_discount, 'laukia', 'svetaine', v_note)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, v_subtotal - v_discount, v_discount;
end;
$$;

-- ---------------------------------------------------------------------------
-- Event tickets (sauna sessions and other capacity-limited events; quad tours
-- keep create_tour_ticket)
-- ---------------------------------------------------------------------------

create function public.create_event_ticket(
  p_event_id uuid,
  p_people smallint,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
begin
  select * into e from public.events
   where events.id = p_event_id and category <> 'keturratis' and published and capacity is not null
     and date >= (now() at time zone 'Europe/Vilnius')::date;
  if not found then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;
  if p_people < 1 or p_people > 20 then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  -- The capacity trigger raises 23P01 / event_full when the seats are gone;
  -- the PR- reference comes from the ticket reference trigger.
  return query
  insert into public.event_tickets (event_id, customer_name, customer_email, customer_phone,
                                    people, total, status, source)
  values (e.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_people, p_people * coalesce(e.price, 0), 'laukia', 'svetaine')
  returning event_tickets.id, event_tickets.reference, event_tickets.total;
end;
$$;

-- ---------------------------------------------------------------------------
-- Inquiries: registration for events without a seat limit, and calculator quotes
-- ---------------------------------------------------------------------------

create function public.register_for_event(
  p_event_id uuid,
  p_people smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_message text default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
begin
  select * into e from public.events
   where events.id = p_event_id and published and capacity is null
     and date >= (now() at time zone 'Europe/Vilnius')::date;
  if not found then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;
  if p_people < 1 or p_people > 200 then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.inquiries q
       where q.status = 'nauja' and q.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  return query
  insert into public.inquiries (customer_name, customer_email, customer_phone, source, event_type, date, guests, message)
  values (btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          'renginys', e.title, e.date, p_people, left(coalesce(btrim(p_message), ''), 2000))
  returning inquiries.id;
end;
$$;

create function public.create_inquiry(
  p_event_type text,
  p_date date,
  p_guests integer,
  p_space text,
  p_estimate_min numeric,
  p_estimate_max numeric,
  p_input jsonb,
  p_message text,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_guests < 1 or p_guests > 1000 then
    raise exception 'Invalid guest count' using errcode = '23514', hint = 'inquiry_guests';
  end if;
  if length(coalesce(p_input::text, '')) > 4000 then
    raise exception 'Calculator input too large' using errcode = '23514', hint = 'inquiry_input';
  end if;

  if (select count(*) from public.inquiries q
       where q.status = 'nauja' and q.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  return query
  insert into public.inquiries (customer_name, customer_email, customer_phone, source, event_type, date, guests,
                                space, estimate_min, estimate_max, calculator_input, message)
  values (btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          'skaiciuokle', left(btrim(p_event_type), 120), p_date, p_guests, left(coalesce(btrim(p_space), ''), 120),
          p_estimate_min, p_estimate_max, p_input, left(coalesce(btrim(p_message), ''), 2000))
  returning inquiries.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text) from public;
grant execute on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text) to anon, authenticated;

revoke execute on function public.create_stay_booking(text, date, smallint, smallint, text, text, text, text, text) from public;
grant execute on function public.create_stay_booking(text, date, smallint, smallint, text, text, text, text, text) to anon, authenticated;

revoke execute on function public.create_event_ticket(uuid, smallint, text, text, text) from public;
grant execute on function public.create_event_ticket(uuid, smallint, text, text, text) to anon, authenticated;

revoke execute on function public.register_for_event(uuid, smallint, text, text, text, text) from public;
grant execute on function public.register_for_event(uuid, smallint, text, text, text, text) to anon, authenticated;

revoke execute on function public.create_inquiry(text, date, integer, text, numeric, numeric, jsonb, text, text, text, text) from public;
grant execute on function public.create_inquiry(text, date, integer, text, numeric, numeric, jsonb, text, text, text, text) to anon, authenticated;
