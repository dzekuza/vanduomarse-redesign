-- Named sauna masters (pirtininkai), edited in /admin/pirtis.
--
-- Each has a price per booking and the shortest session he works (3 h by default). Private sauna
-- programs and hourly bookings offer them below the sauna choice ("Be pirtininko" or a name); the
-- price is added on top and stored as a `booking_extras` line ("Pirtininkas: <name>"), so receipts,
-- payments and the admin already show it. Replaces the generic `pirtininkas` extra added in
-- 20261112090000 (kept, switched off).

create table public.sauna_masters (
  id text primary key check (id ~ '^[a-z0-9-]+$' and length(id) <= 60),
  name text not null check (length(btrim(name)) between 2 and 60),
  description text not null default '' check (length(description) <= 240),
  price numeric(10, 2) not null check (price between 0 and 100000),
  min_hours smallint not null default 3 check (min_hours between 1 and 12),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sauna_masters is 'Sauna masters (pirtininkai) a customer can add to a private sauna booking; price per booking, edited in /admin/pirtis.';

create trigger sauna_masters_updated_at before update on public.sauna_masters
  for each row execute function public.set_updated_at();

alter table public.sauna_masters enable row level security;

create policy "anon read active masters" on public.sauna_masters
  for select to anon using (active);
create policy "pirtis masters read" on public.sauna_masters
  for select to authenticated using (active or (select private.has_any_permission(array['pirtis', 'rezervacijos'])));
create policy "pirtis masters insert" on public.sauna_masters
  for insert to authenticated with check ((select private.has_permission('pirtis')));
create policy "pirtis masters update" on public.sauna_masters
  for update to authenticated using ((select private.has_permission('pirtis'))) with check ((select private.has_permission('pirtis')));
create policy "pirtis masters delete" on public.sauna_masters
  for delete to authenticated using ((select private.has_permission('pirtis')));

grant select on public.sauna_masters to anon;
grant select, insert, update, delete on public.sauna_masters to authenticated;

-- The extra from 20261112090000 becomes the first named master.
insert into public.sauna_masters (id, name, description, price, min_hours, active, sort_order)
select u.id, u.name, 'Garai, vanojimas ir ritualas.', u.price, coalesce(u.min_hours, 3), true, 0
from public.sauna_upsells u where u.id = 'pirtininkas'
on conflict (id) do nothing;
update public.sauna_upsells set active = false where id = 'pirtininkas';

drop function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text, text);
drop function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text);

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

  v_base := (v_prices ->> p_hours::text)::numeric + greatest(0, p_party - s.included_guests) * s.extra_guest_fee;

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

CREATE OR REPLACE FUNCTION public.create_program_booking(p_program_id text, p_date date, p_start_hour smallint, p_party smallint, p_name text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_discount_code text DEFAULT NULL::text, p_master_id text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, reference text, total numeric, code_discount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  pr public.sauna_programs;
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_hours smallint;
  m public.sauna_masters;
  v_master numeric := 0;
  v_base numeric;
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

  if p_master_id is not null then
    select * into m from public.sauna_masters where sauna_masters.id = p_master_id and active;
    if not found then
      raise exception 'Sauna master unavailable' using errcode = '23503', hint = 'master_unavailable';
    end if;
    v_master := m.price;
  end if;
  v_base := pr.price + v_master;

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', v_base) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  v_note := left(concat_ws(' · ', 'Programa: ' || pr.name, nullif(btrim(coalesce(p_note, '')), ''),
    case when v_code_id is not null then 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €' end), 300);

  insert into public.bookings (kind, sauna_id, program_id, customer_name, customer_email, customer_phone, date,
                               start_hour, hours, guests, total, status, source, note,
                               discount_code_id, discount_code, discount_amount)
  values ('pirtis', s.id, pr.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, v_hours, p_party, v_base - v_code_discount, 'laukia', 'svetaine', v_note,
          v_code_id, v_code_text, v_code_discount)
  returning bookings.id, bookings.reference into v_id, v_ref;

  if m.id is not null then
    insert into public.booking_extras (booking_id, upsell_id, name, unit, unit_price, quantity, line_total)
    values (v_id, null, left('Pirtininkas: ' || m.name, 120), 'rezervacijai', m.price, 1, m.price);
  end if;

  return query select v_id, v_ref, v_base - v_code_discount, v_code_discount;
end;
$function$;

revoke execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text, text, text) from public;
revoke execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text, text) from public;
grant execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text, text) to anon, authenticated;
