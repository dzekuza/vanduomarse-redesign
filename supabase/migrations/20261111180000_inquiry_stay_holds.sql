-- Vanduo Marse: accepting a calculator inquiry books its cabins and saunas.
--
-- The event price calculator stores what the visitor picked in inquiries.calculator_input
-- (cabinUnits: stay type id -> cabins, cabinNights). Until now staff could only read it, so the
-- same cabins stayed free on /rezervacija. Accepting the inquiry now creates one confirmed stay
-- booking per cabin type (arriving on the event date), linked back to the inquiry. Those bookings
-- count in stay_occupancy() and the stay capacity trigger like any other, so the cabins are taken.
--
-- Saunas work the same way: calculator_input.saunas maps a sauna id to { hours, startHour, programId, extras }.
-- The price is always recomputed here from the saunas row, or from the chosen private program's own flat
-- price and length (never taken from the visitor-supplied input). Extras (priedai) picked for the sauna
-- are copied as booking_extras, priced from sauna_upsells and limited to the ones that sauna offers.
-- A sauna with a start hour becomes a confirmed sauna booking on the event date (the overlap and block
-- triggers reject a taken slot); one without a start hour is only a quote line and is skipped.
--
-- Needs both the `uzklausos` and `rezervacijos` page permissions (owners pass both).

alter table public.inquiries add column accepted_at timestamptz;
comment on column public.inquiries.accepted_at is 'Set when staff accepted the inquiry and its cabins were booked (bookings.inquiry_id).';

alter table public.bookings add column inquiry_id uuid references public.inquiries (id) on delete set null;
create index bookings_inquiry_idx on public.bookings (inquiry_id) where inquiry_id is not null;
comment on column public.bookings.inquiry_id is 'The calculator inquiry whose acceptance created this stay booking.';

create function public.accept_inquiry_stays(p_inquiry_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
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

    -- Current inquiries key by stay type id; the first calculator keyed by size ("2", "4").
    select * into t from public.stay_types
    where kind = 'namelis' and (id = v_key or id = 'namelis-' || v_key)
    order by (id = v_key) desc
    limit 1;
    if not found then
      raise exception 'Unknown stay type %', v_key using errcode = '23514', hint = 'stay_type_missing';
    end if;

    -- The stay capacity trigger rejects the insert (stay_full) when the cabins are not free.
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
      continue; -- no start hour chosen: a quote line only
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
    -- A private program fixes the length and the flat price; it must belong to this sauna and be on sale.
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

    -- The inquiry is public input: hold only sessions the sauna's own rules allow.
    if (pr.id is null and (v_hours < sa.min_hours or v_hours > sa.max_hours)) or v_start < sa.open_hour or v_start + v_hours > sa.close_hour then
      raise exception 'Session is outside the sauna''s hours' using errcode = '23514', hint = 'sauna_hours';
    end if;
    v_party := greatest(1, least(i.guests, sa.max_party));
    if pr.id is not null then
      v_price := case when pr.pricing = 'group' then pr.price else pr.price * i.guests end;
    else
      -- Same rule as sessionPrice() in lib/sauna.ts: minimum hours billed, the package if cheaper.
      v_billable := greatest(sa.min_hours, v_hours);
      v_price := v_billable * case when i.guests <= sa.small_group_max then sa.small_group_rate else sa.large_group_rate end;
      if v_billable = sa.package_hours then
        v_price := least(v_price, sa.package_price);
      end if;
    end if;

    -- The overlap and block triggers reject the insert (sauna_booked / sauna_blocked) when the slot is not free.
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
$$;

create function public.release_inquiry_stays(p_inquiry_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_released integer;
begin
  if not ((select private.has_permission('uzklausos')) and (select private.has_permission('rezervacijos'))) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.bookings set status = 'atsaukta'
  where inquiry_id = p_inquiry_id and status <> 'atsaukta';
  get diagnostics v_released = row_count;

  update public.inquiries set accepted_at = null where id = p_inquiry_id;
  return v_released;
end;
$$;

revoke execute on function public.accept_inquiry_stays(uuid) from public, anon;
revoke execute on function public.release_inquiry_stays(uuid) from public, anon;
grant execute on function public.accept_inquiry_stays(uuid) to authenticated;
grant execute on function public.release_inquiry_stays(uuid) to authenticated;
