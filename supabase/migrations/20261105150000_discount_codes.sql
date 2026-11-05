-- Vanduo Marse: discount codes (ADR-0036).
--
-- A discount code is a promotion (percent or fixed euros off), separate from a
-- gift coupon (a prepaid balance). Codes live in their own table and are never
-- read by customers directly: the checkout checks one with
-- check_discount_code(), and every booking RPC recomputes the discount itself
-- through private.apply_discount_code() and stores the code and the amount on
-- the row. The code is applied to the subtotal first; a gift coupon then pays
-- from what is left.
--
-- Uses are not a counter: a use is a booking, quad rental or ticket that
-- carries the code and is not cancelled, so failed or abandoned checkouts
-- (cancel_unpaid_requests) give the use back by themselves. The code row is
-- locked while a request is filed, so max_uses holds under concurrency.
--
-- Staff access is keyed to the new `nuolaidos` page permission (ADR-0012).
--
-- Requires 20261104191000 (create_program_ticket for legacy sauna sessions):
-- this migration replaces that function with the same body plus the code.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create type public.discount_kind as enum ('procentai', 'suma');

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  -- Stored normalised: upper case letters and digits only.
  code text not null unique check (code ~ '^[A-Z0-9]{3,30}$'),
  kind public.discount_kind not null,
  value numeric(10, 2) not null check (value > 0 and (kind <> 'procentai' or value <= 100)),
  services text[] not null check (cardinality(services) > 0 and services <@ array['pirtis', 'nakvyne', 'keturraciai']),
  valid_from date,
  valid_until date,
  max_uses integer check (max_uses is null or max_uses > 0),
  active boolean not null default true,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_dates check (valid_from is null or valid_until is null or valid_until >= valid_from)
);

comment on table public.discount_codes is 'Promotional discount codes (ADR-0036). Customers apply them only through check_discount_code() and the booking RPCs.';

create trigger discount_codes_updated_at before update on public.discount_codes
  for each row execute function public.set_updated_at();

-- What a request got from a code. The text and amount stay when a code is deleted.
alter table public.bookings
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);
alter table public.quad_rentals
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);
alter table public.event_tickets
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);

create index bookings_discount_code_idx on public.bookings (discount_code_id) where discount_code_id is not null;
create index quad_rentals_discount_code_idx on public.quad_rentals (discount_code_id) where discount_code_id is not null;
create index event_tickets_discount_code_idx on public.event_tickets (discount_code_id) where discount_code_id is not null;

-- ---------------------------------------------------------------------------
-- Page permission and RLS
-- ---------------------------------------------------------------------------

alter table public.staff_roles drop constraint staff_roles_permissions_known;
alter table public.staff_roles add constraint staff_roles_permissions_known check (
  permissions <@ array['apzvalga', 'rezervacijos', 'uzimtumas', 'uzklausos', 'keturraciai', 'kuponai', 'nuolaidos', 'renginiai', 'pirtis', 'kainos']
);

alter table public.discount_codes enable row level security;
revoke all on public.discount_codes from anon;

create policy "nuolaidos discount codes read" on public.discount_codes
  for select to authenticated using ((select private.has_permission('nuolaidos')));
create policy "nuolaidos discount codes insert" on public.discount_codes
  for insert to authenticated with check ((select private.has_permission('nuolaidos')));
create policy "nuolaidos discount codes update" on public.discount_codes
  for update to authenticated using ((select private.has_permission('nuolaidos'))) with check ((select private.has_permission('nuolaidos')));
create policy "nuolaidos discount codes delete" on public.discount_codes
  for delete to authenticated using ((select private.has_permission('nuolaidos')));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function private.normalize_discount_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Requests holding the code that are not cancelled.
create function private.discount_code_uses(p_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select ((select count(*) from public.bookings b where b.discount_code_id = p_id and b.status <> 'atsaukta')
        + (select count(*) from public.quad_rentals q where q.discount_code_id = p_id and q.status <> 'atsaukta')
        + (select count(*) from public.event_tickets t where t.discount_code_id = p_id and t.status <> 'atsaukta'))::integer;
$$;

-- Validates a code for a service and returns what it takes off p_subtotal; no row for an empty code.
-- Locks the code row until the calling transaction ends, so concurrent requests count each other.
create function private.apply_discount_code(p_code text, p_service text, p_subtotal numeric)
returns table (code_id uuid, code text, amount numeric)
language plpgsql
set search_path = ''
as $$
declare
  d public.discount_codes;
  v_code text := private.normalize_discount_code(p_code);
  v_today date := (now() at time zone 'Europe/Vilnius')::date;
begin
  if v_code = '' then
    return;
  end if;
  select * into d from public.discount_codes where discount_codes.code = v_code for update;
  if not found or not d.active or not (p_service = any (d.services))
     or (d.valid_from is not null and v_today < d.valid_from)
     or (d.valid_until is not null and v_today > d.valid_until) then
    raise exception 'Discount code not valid' using errcode = '23514', hint = 'discount_invalid';
  end if;
  if d.max_uses is not null and private.discount_code_uses(d.id) >= d.max_uses then
    raise exception 'Discount code used up' using errcode = '23514', hint = 'discount_used_up';
  end if;
  return query select d.id, d.code,
    case d.kind
      when 'procentai' then round(greatest(p_subtotal, 0) * d.value / 100, 2)
      else least(d.value, greatest(p_subtotal, 0))
    end;
end;
$$;

revoke execute on function private.normalize_discount_code(text) from public, anon, authenticated;
revoke execute on function private.discount_code_uses(uuid) from public, anon, authenticated;
revoke execute on function private.apply_discount_code(text, text, numeric) from public, anon, authenticated;

-- The checkout's live check: what the code gives, without the customer reading the table.
create function public.check_discount_code(p_code text)
returns table (code text, kind public.discount_kind, value numeric, services text[])
language sql
stable
security definer
set search_path = ''
as $$
  select d.code, d.kind, d.value, d.services
  from public.discount_codes d
  where d.code = private.normalize_discount_code(p_code)
    and d.active
    and (d.valid_from is null or d.valid_from <= (now() at time zone 'Europe/Vilnius')::date)
    and (d.valid_until is null or d.valid_until >= (now() at time zone 'Europe/Vilnius')::date)
    and (d.max_uses is null or private.discount_code_uses(d.id) < d.max_uses);
$$;

revoke execute on function public.check_discount_code(text) from public;
grant execute on function public.check_discount_code(text) to anon, authenticated;

-- Usage per code for /admin/nuolaidos (staff may lack the booking pages' permissions).
create function public.discount_code_usage()
returns table (code_id uuid, uses integer, discount_total numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('nuolaidos') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select d.id, private.discount_code_uses(d.id),
           coalesce((select sum(r.amount) from (
              select b.discount_amount as amount from public.bookings b where b.discount_code_id = d.id and b.status <> 'atsaukta'
              union all
              select q.discount_amount from public.quad_rentals q where q.discount_code_id = d.id and q.status <> 'atsaukta'
              union all
              select t.discount_amount from public.event_tickets t where t.discount_code_id = d.id and t.status <> 'atsaukta'
            ) r), 0)
    from public.discount_codes d;
end;
$$;

revoke execute on function public.discount_code_usage() from public, anon;
grant execute on function public.discount_code_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- Booking RPCs: same bodies as before, plus p_discount_code and code_discount.
-- ---------------------------------------------------------------------------

drop function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text);
drop function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text);
drop function public.create_stay_booking(text, date, smallint, smallint, text, text, text, text, text);
drop function public.create_stay_booking_with_units(text, date, smallint, smallint, text, smallint, text, text, text, text);
drop function public.create_quad_rental(text, date, smallint, smallint, smallint, smallint, text, text, text, text);
drop function public.create_mixed_quad_rental(jsonb, date, smallint, smallint, smallint, text, text, text, text);
drop function public.create_program_booking(text, date, smallint, smallint, text, text, text, text);
drop function public.create_program_ticket(uuid, smallint, smallint, text, text, text);

-- Sauna, hourly ------------------------------------------------------------

create function public.create_sauna_booking(
  p_sauna_id text,
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_party smallint,
  p_extras jsonb,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_coupon text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, discount numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_rate numeric;
  v_hourly numeric;
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
$$;

-- The previous signature books the first active sauna, so an app deployed
-- before 20261030100000 keeps working. Drop it once no deployed app calls it.
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
language sql
security definer
set search_path = ''
as $$
  select r.id, r.reference, r.total, r.discount from public.create_sauna_booking(
    (select s.id from public.saunas s where s.active order by s.sort_order, s.created_at limit 1),
    p_date, p_start_hour, p_hours, p_party, p_extras, p_name, p_email, p_phone, p_note, p_coupon) r;
$$;

comment on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text)
  is 'Deprecated (20261030100000): books the first active sauna. Use the p_sauna_id overload.';

-- Stays ---------------------------------------------------------------------

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
  p_coupon text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, discount numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.stay_types;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
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

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'nakvyne', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);
  if v_code_id is not null then
    v_note := left(concat_ws(' · ', v_note, 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €'), 300);
  end if;

  if v_code <> '' then
    select least(v_subtotal - v_code_discount, c.balance) into v_discount
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
                               stay_units, guests, total, status, source, note, discount_code_id, discount_code, discount_amount)
  values (t.kind, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_nights, t.id, p_units, p_guests, v_subtotal - v_code_discount - v_discount, 'laukia', 'svetaine', v_note,
          v_code_id, v_code_text, v_code_discount)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, v_subtotal - v_code_discount - v_discount, v_discount, v_code_discount;
end;
$$;

create function public.create_stay_booking(
  p_stay_type_id text,
  p_date date,
  p_nights smallint,
  p_guests smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_coupon text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, discount numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_guests is null then
    raise exception 'Guest count required' using errcode = '23514', hint = 'stay_guests';
  end if;
  return query select * from public.create_stay_booking_with_units(
    p_stay_type_id, p_date, p_nights, 1::smallint, p_name, p_guests, p_email, p_phone, p_note, p_coupon, p_discount_code
  );
end;
$$;

-- Quads ---------------------------------------------------------------------

create function public.create_quad_rental(
  p_type_id text,
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_units smallint,
  p_riders smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.quad_types;
  s public.quad_settings;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_subtotal numeric;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select * into t from public.quad_types where quad_types.id = p_type_id and active;
  if not found then
    raise exception 'Quad type unavailable' using errcode = '23503', hint = 'quad_unavailable';
  end if;
  select * into s from public.quad_settings;

  if p_hours < 1 or p_hours > s.max_hours or p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'quad_closed';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'quad_past';
  end if;
  if p_units < 1 or p_riders < 1 or p_riders > p_units * t.seats then
    raise exception 'Too many riders for the chosen quads' using errcode = '23514', hint = 'quad_riders';
  end if;

  if (select count(*) from public.quad_rentals r
       where r.status = 'laukia' and r.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_subtotal := p_hours * p_units * t.price_per_hour;
  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'keturraciai', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);
  if v_code_id is not null then
    v_note := left(concat_ws(' · ', v_note, 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €'), 300);
  end if;

  return query
  insert into public.quad_rentals (quad_type_id, date, start_hour, hours, units, riders,
                                   customer_name, customer_email, customer_phone, total, note,
                                   discount_code_id, discount_code, discount_amount)
  values (t.id, p_date, p_start_hour, p_hours, p_units, p_riders,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_subtotal - v_code_discount, v_note, v_code_id, v_code_text, v_code_discount)
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total, quad_rentals.discount_amount;
end;
$$;

create function public.create_mixed_quad_rental(
  p_allocations jsonb,
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_riders smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.quad_settings;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_id uuid := gen_random_uuid();
  v_count integer;
  v_types integer;
  v_units integer;
  v_seats integer;
  v_hourly_total numeric;
  v_subtotal numeric;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  -- The same 20-unit limit as single-type rentals and MAX_QUAD_RENTAL_UNITS.
  if jsonb_typeof(p_allocations) is distinct from 'array' then
    raise exception 'Allocations must be an array' using errcode = '23514', hint = 'quad_units';
  end if;
  v_count := jsonb_array_length(p_allocations);
  if v_count not between 2 and 20 or exists (
    select 1 from jsonb_array_elements(p_allocations) as a
    where jsonb_typeof(a -> 'quad_type_id') is distinct from 'string'
       or (a ->> 'quad_type_id') !~ '^[a-z0-9-]{1,60}$'
       or jsonb_typeof(a -> 'units') is distinct from 'number'
       or (a ->> 'units') !~ '^([1-9]|1[0-9]|20)$'
  ) then
    raise exception 'Invalid quad rental allocations' using errcode = '23514', hint = 'quad_units';
  end if;

  select count(distinct a.quad_type_id), sum(a.units) into v_types, v_units
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint);
  if v_types <> v_count or v_units > 20 then
    raise exception 'Duplicate types or too many units' using errcode = '23514', hint = 'quad_units';
  end if;

  select count(*), sum(t.seats * a.units), sum(t.price_per_hour * a.units)
  into v_types, v_seats, v_hourly_total
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint)
  join public.quad_types t on t.id = a.quad_type_id and t.active;
  if v_types <> v_count then
    raise exception 'Quad type unavailable' using errcode = '23503', hint = 'quad_unavailable';
  end if;
  if p_riders is null or p_riders < 1 or p_riders > v_seats then
    raise exception 'Too many riders for the chosen quads' using errcode = '23514', hint = 'quad_riders';
  end if;

  select * into s from public.quad_settings where quad_settings.id;
  if not found or p_hours is null or p_start_hour is null
     or p_hours < 1 or p_hours > s.max_hours or p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'quad_closed';
  end if;
  if p_date is null or p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'quad_past';
  end if;
  if (select count(*) from public.quad_rentals r
       where r.status = 'laukia' and r.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_subtotal := p_hours * v_hourly_total;
  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'keturraciai', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);
  if v_code_id is not null then
    v_note := left(concat_ws(' · ', v_note, 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €'), 300);
  end if;

  -- The deferred header FK lets the existing capacity trigger see all types
  -- when the header is inserted. Any failure rolls the allocations back too.
  insert into public.quad_rental_items (rental_id, quad_type_id, units)
  select v_id, a.quad_type_id, a.units
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint);

  return query
  insert into public.quad_rentals (id, date, start_hour, hours, units, riders,
                                   customer_name, customer_email, customer_phone, total, note,
                                   discount_code_id, discount_code, discount_amount)
  values (v_id, p_date, p_start_hour, p_hours, v_units, p_riders,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_subtotal - v_code_discount, v_note, v_code_id, v_code_text, v_code_discount)
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total, quad_rentals.discount_amount;
end;
$$;

-- Sauna programs -------------------------------------------------------------

create function public.create_program_booking(
  p_program_id text,
  p_date date,
  p_start_hour smallint,
  p_party smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  pr public.sauna_programs;
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_hours smallint;
  v_note text;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_id uuid;
  v_ref text;
begin
  select * into pr from public.sauna_programs
   where sauna_programs.id = p_program_id and sauna_programs.active and sauna_programs.kind = 'private';
  if not found then
    raise exception 'Program unavailable' using errcode = '23503', hint = 'program_unavailable';
  end if;
  select * into s from public.saunas where saunas.id = pr.sauna_id and saunas.active;
  if not found then
    raise exception 'Sauna unavailable' using errcode = '23503', hint = 'sauna_unavailable';
  end if;

  v_hours := (pr.duration_minutes / 60)::smallint;
  if p_start_hour < s.open_hour or p_start_hour + v_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
  end if;
  if p_party < 1 or p_party > least(pr.capacity, s.max_party) then
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

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', pr.price) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  v_note := left(concat_ws(' · ', 'Programa: ' || pr.name, nullif(btrim(coalesce(p_note, '')), ''),
    case when v_code_id is not null then 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €' end), 300);

  insert into public.bookings (kind, sauna_id, program_id, customer_name, customer_email, customer_phone, date,
                               start_hour, hours, guests, total, status, source, note,
                               discount_code_id, discount_code, discount_amount)
  values ('pirtis', s.id, pr.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, v_hours, p_party, pr.price - v_code_discount, 'laukia', 'svetaine', v_note,
          v_code_id, v_code_text, v_code_discount)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, pr.price - v_code_discount, v_code_discount;
end;
$$;

-- Same body as 20261104191000 (legacy sessions included), plus the code.
create function public.create_program_ticket(
  p_event_id uuid,
  p_adults smallint,
  p_children smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  pr public.sauna_programs;
  v_people integer := p_adults::integer + p_children;
  v_total numeric;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
begin
  select * into e from public.events
   where events.id = p_event_id and events.category = 'pirtis'
     and events.published and events.capacity is not null
   for update;
  if not found or e.date + e.start_time <= (clock_timestamp() at time zone 'Europe/Vilnius') then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;

  if e.program_id is not null then
    select * into pr from public.sauna_programs
     where sauna_programs.id = e.program_id and sauna_programs.active and sauna_programs.kind = 'session';
    if not found then
      raise exception 'Program unavailable' using errcode = '23503', hint = 'event_unavailable';
    end if;
  end if;

  if v_people is null or p_adults < 0 or p_children < 0 or v_people < 1 or v_people > 20
     or (pr.pricing is distinct from 'family' and p_children > 0)
     or (pr.pricing = 'family' and p_adults < 1) then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_total := case when e.program_id is null then v_people * coalesce(e.price, 0)
    else p_adults * pr.price + p_children * coalesce(pr.child_price, pr.price) end;

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', v_total) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  -- The existing trigger checks live capacity and raises event_full when needed.
  return query
  insert into public.event_tickets (event_id, customer_name, customer_email, customer_phone,
                                    people, children, total, status, source,
                                    discount_code_id, discount_code, discount_amount)
  values (e.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_people, p_children, v_total - v_code_discount, 'laukia', 'svetaine',
          v_code_id, v_code_text, v_code_discount)
  returning event_tickets.id, event_tickets.reference, event_tickets.total, event_tickets.discount_amount;
end;
$$;

-- Grants: the same public RPCs as before.
revoke execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text, text) from public;
revoke execute on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text) from public;
revoke execute on function public.create_stay_booking_with_units(text, date, smallint, smallint, text, smallint, text, text, text, text, text) from public;
revoke execute on function public.create_stay_booking(text, date, smallint, smallint, text, text, text, text, text, text) from public;
revoke execute on function public.create_quad_rental(text, date, smallint, smallint, smallint, smallint, text, text, text, text, text) from public;
revoke execute on function public.create_mixed_quad_rental(jsonb, date, smallint, smallint, smallint, text, text, text, text, text) from public;
revoke execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text) from public;
revoke execute on function public.create_program_ticket(uuid, smallint, smallint, text, text, text, text) from public;

grant execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_stay_booking_with_units(text, date, smallint, smallint, text, smallint, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_stay_booking(text, date, smallint, smallint, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_quad_rental(text, date, smallint, smallint, smallint, smallint, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_mixed_quad_rental(jsonb, date, smallint, smallint, smallint, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_program_ticket(uuid, smallint, smallint, text, text, text, text) to anon, authenticated;
