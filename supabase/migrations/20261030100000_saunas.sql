-- Vanduo Marse: several sauna types instead of one.
--
-- Each sauna has its own name, description, features, photos (Storage paths in
-- the public `sauna-photos` bucket, array order = display order), rates, hours,
-- capacity and the extras it offers. Bookings and staff-closed hours belong to
-- one sauna, and the overlap / closed-hour rules apply per sauna.
--
-- The single-row `sauna_settings` becomes the first sauna ("Pirtis Marse"); every
-- existing sauna booking, closed hour and extra is attached to it. The table
-- itself stays (unused by the app) so nothing that still reads it breaks.

-- ---------------------------------------------------------------------------
-- Saunas
-- ---------------------------------------------------------------------------

create table public.saunas (
  id text primary key check (id ~ '^[a-z0-9-]+$' and length(id) <= 60),
  name text not null check (length(btrim(name)) between 2 and 60),
  description text not null default '' check (length(description) <= 400),
  features text[] not null default '{}' check (cardinality(features) <= 12),
  photos text[] not null default '{}' check (cardinality(photos) <= 12),
  small_group_max smallint not null check (small_group_max between 1 and 50),
  small_group_rate numeric(10, 2) not null check (small_group_rate between 0 and 100000),
  large_group_rate numeric(10, 2) not null check (large_group_rate between 0 and 100000),
  max_party smallint not null check (max_party between 1 and 100),
  min_hours smallint not null check (min_hours between 1 and 12),
  max_hours smallint not null check (max_hours between 1 and 12),
  package_hours smallint not null check (package_hours between 1 and 12),
  package_price numeric(10, 2) not null check (package_price between 0 and 100000),
  open_hour smallint not null check (open_hour between 0 and 23),
  close_hour smallint not null check (close_hour between 1 and 24),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Same cross-field rules as components/admin/sauna/rates-schema.ts
  constraint saunas_party check (max_party > small_group_max),
  constraint saunas_hours check (min_hours <= max_hours),
  constraint saunas_package check (package_hours between min_hours and max_hours),
  constraint saunas_opening check (close_hour - open_hour >= min_hours)
);

comment on table public.saunas is 'Sauna types for private hire: details, photos (sauna-photos bucket paths), rates and limits; edited in /admin/pirtis.';

create trigger saunas_updated_at before update on public.saunas
  for each row execute function public.set_updated_at();

-- Extras a sauna offers, from the shared sauna_upsells catalogue.
create table public.sauna_upsell_links (
  sauna_id text not null references public.saunas (id) on update cascade on delete cascade,
  upsell_id text not null references public.sauna_upsells (id) on update cascade on delete cascade,
  primary key (sauna_id, upsell_id)
);

create index sauna_upsell_links_upsell_idx on public.sauna_upsell_links (upsell_id);

insert into public.saunas (id, name, description, features, small_group_max, small_group_rate, large_group_rate, max_party,
                           min_hours, max_hours, package_hours, package_price, open_hour, close_hour, sort_order)
select 'pirtis-marse', 'Pirtis Marse', 'Malkomis kūrenama pirtis prie pat ežero kranto.',
       array['Iki ' || s.max_party || ' žmonių', 'Kūrenama malkomis', 'Prie pat ežero'],
       s.small_group_max, s.small_group_rate, s.large_group_rate, s.max_party,
       s.min_hours, s.max_hours, s.package_hours, s.package_price, s.open_hour, s.close_hour, 0
from public.sauna_settings s;

insert into public.sauna_upsell_links (sauna_id, upsell_id)
select 'pirtis-marse', u.id from public.sauna_upsells u
where exists (select 1 from public.saunas where id = 'pirtis-marse');

comment on table public.sauna_settings is 'Superseded by public.saunas (20261030100000). Kept read-only for compatibility; the app no longer reads it.';

-- ---------------------------------------------------------------------------
-- Bookings and closed hours belong to a sauna
-- ---------------------------------------------------------------------------

alter table public.bookings add column sauna_id text references public.saunas (id) on update cascade on delete restrict;
update public.bookings set sauna_id = 'pirtis-marse' where kind = 'pirtis';
alter table public.bookings add constraint bookings_sauna check ((kind = 'pirtis') = (sauna_id is not null));

alter table public.bookings drop constraint bookings_no_sauna_overlap;
alter table public.bookings add constraint bookings_no_sauna_overlap exclude using gist (
  sauna_id with =,
  date with =,
  int4range(start_hour, start_hour + hours) with &&
) where (kind = 'pirtis' and status <> 'atsaukta');

create index bookings_sauna_idx on public.bookings (sauna_id, date) where sauna_id is not null;

alter table public.sauna_blocks add column sauna_id text references public.saunas (id) on update cascade on delete cascade;
update public.sauna_blocks set sauna_id = 'pirtis-marse';
alter table public.sauna_blocks alter column sauna_id set not null;
alter table public.sauna_blocks drop constraint sauna_blocks_date_hour_key;
alter table public.sauna_blocks add constraint sauna_blocks_sauna_date_hour_key unique (sauna_id, date, hour);

-- Same rules as before, per sauna. SECURITY DEFINER as set in 20261028120000.
create or replace function public.enforce_sauna_block_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour smallint;
begin
  if new.kind <> 'pirtis' or new.status = 'atsaukta' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('sauna:' || new.sauna_id || ':' || new.date));

  select b.hour into v_hour
  from public.sauna_blocks b
  where b.sauna_id = new.sauna_id
    and b.date = new.date
    and b.hour >= new.start_hour
    and b.hour < new.start_hour + new.hours
  order by b.hour
  limit 1;

  if found then
    raise exception 'Sauna hour %:00 on % is closed', v_hour, new.date
      using errcode = '23P01', hint = 'sauna_blocked';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_block_not_booked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('sauna:' || new.sauna_id || ':' || new.date));

  if exists (
    select 1
    from public.bookings b
    where b.kind = 'pirtis'
      and b.status <> 'atsaukta'
      and b.sauna_id = new.sauna_id
      and b.date = new.date
      and new.hour >= b.start_hour
      and new.hour < b.start_hour + b.hours
  ) then
    raise exception 'Sauna hour %:00 on % is already booked', new.hour, new.date
      using errcode = '23P01', hint = 'sauna_booked';
  end if;
  return new;
end;
$$;

drop trigger bookings_sauna_block_free on public.bookings;
create trigger bookings_sauna_block_free
  before insert or update of kind, sauna_id, date, start_hour, hours, status on public.bookings
  for each row execute function public.enforce_sauna_block_free();

drop trigger sauna_blocks_not_booked on public.sauna_blocks;
create trigger sauna_blocks_not_booked
  before insert or update of sauna_id, date, hour on public.sauna_blocks
  for each row execute function public.enforce_block_not_booked();

-- ---------------------------------------------------------------------------
-- Public availability per sauna
-- ---------------------------------------------------------------------------

create function public.sauna_taken(p_from date, p_to date)
returns table (sauna_id text, day date, hour smallint)
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
    select b.sauna_id, b.date, h::smallint
    from public.bookings b
    cross join lateral generate_series(b.start_hour, b.start_hour + b.hours - 1) as h
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date between p_from and p_to
    union
    select s.sauna_id, s.date, s.hour
    from public.sauna_blocks s
    where s.date between p_from and p_to
    order by 1, 2, 3;
end;
$$;

comment on function public.sauna_taken is 'Booked or closed hours per sauna and day, for the public start-time grid. No customer data.';
comment on function public.sauna_taken_hours is 'Deprecated (20261030100000): hours taken in any sauna. Use sauna_taken(); drop once no deployed app calls it.';

revoke execute on function public.sauna_taken(date, date) from public;
grant execute on function public.sauna_taken(date, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private hire request for one sauna
-- ---------------------------------------------------------------------------

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
  p_coupon text default null
)
returns table (id uuid, reference text, total numeric, discount numeric)
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

  insert into public.bookings (kind, sauna_id, customer_name, customer_email, customer_phone, date, start_hour, hours,
                               guests, total, status, source, note)
  values ('pirtis', s.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
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
  join public.sauna_upsell_links l on l.upsell_id = u.id and l.sauna_id = s.id
  where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1;

  return query select v_id, v_ref, v_subtotal - v_discount, v_discount;
end;
$$;

revoke execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text) from public;
grant execute on function public.create_sauna_booking(text, date, smallint, smallint, smallint, jsonb, text, text, text, text, text) to anon, authenticated;

-- The previous signature books the first active sauna, so an app deployed
-- before this migration keeps working. Drop it once no deployed app calls it.
create or replace function public.create_sauna_booking(
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
  select * from public.create_sauna_booking(
    (select s.id from public.saunas s where s.active order by s.sort_order, s.created_at limit 1),
    p_date, p_start_hour, p_hours, p_party, p_extras, p_name, p_email, p_phone, p_note, p_coupon);
$$;

comment on function public.create_sauna_booking(date, smallint, smallint, smallint, jsonb, text, text, text, text, text)
  is 'Deprecated (20261030100000): books the first active sauna. Use the p_sauna_id overload.';

-- ---------------------------------------------------------------------------
-- RLS (ADR-0012: staff access keyed to the `pirtis` page)
-- ---------------------------------------------------------------------------

alter table public.saunas enable row level security;
alter table public.sauna_upsell_links enable row level security;

create policy "anon read active saunas" on public.saunas
  for select to anon using (active);
create policy "pirtis saunas read" on public.saunas
  for select to authenticated using (active or (select private.has_any_permission(array['pirtis', 'rezervacijos', 'uzimtumas', 'apzvalga'])));
create policy "pirtis saunas insert" on public.saunas
  for insert to authenticated with check ((select private.has_permission('pirtis')));
create policy "pirtis saunas update" on public.saunas
  for update to authenticated using ((select private.has_permission('pirtis'))) with check ((select private.has_permission('pirtis')));
create policy "pirtis saunas delete" on public.saunas
  for delete to authenticated using ((select private.has_permission('pirtis')));

-- Which extra goes with which sauna is not sensitive.
create policy "public read sauna upsell links" on public.sauna_upsell_links
  for select to anon, authenticated using (true);
create policy "pirtis sauna upsell links insert" on public.sauna_upsell_links
  for insert to authenticated with check ((select private.has_permission('pirtis')));
create policy "pirtis sauna upsell links delete" on public.sauna_upsell_links
  for delete to authenticated using ((select private.has_permission('pirtis')));

revoke insert, update, delete, truncate on public.saunas, public.sauna_upsell_links from anon;

-- ---------------------------------------------------------------------------
-- Photos: public bucket, staff with `pirtis` upload and remove
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sauna-photos', 'sauna-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "pirtis sauna photos read" on storage.objects
  for select to authenticated using (bucket_id = 'sauna-photos' and (select private.has_permission('pirtis')));
create policy "pirtis sauna photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'sauna-photos' and (select private.has_permission('pirtis')));
create policy "pirtis sauna photos update" on storage.objects
  for update to authenticated using (bucket_id = 'sauna-photos' and (select private.has_permission('pirtis')))
  with check (bucket_id = 'sauna-photos' and (select private.has_permission('pirtis')));
create policy "pirtis sauna photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'sauna-photos' and (select private.has_permission('pirtis')));
