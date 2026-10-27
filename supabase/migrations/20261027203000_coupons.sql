-- Vanduo Marse: purchasable gift coupons.
--
-- Two kinds of product: a euro value ("verte", spendable on anything) and an
-- experience ("paslauga", tied to one service). Customers buy through server
-- actions that call create_coupon_order(); the order waits ("laukia_apmokejimo")
-- until staff confirm payment with activate_coupon(), which issues the code.
-- Redemption (partial or full) is a row in coupon_redemptions; a trigger keeps
-- coupons.balance and status in step, like events.sold.
--
-- Anon never reads coupons or redemptions. It can create an order and check a
-- code (balance only), both through security definer functions.

create type public.coupon_kind as enum ('verte', 'paslauga');
create type public.coupon_service as enum ('visi', 'kabelis', 'pirtis', 'miegas');
create type public.coupon_status as enum ('laukia_apmokejimo', 'aktyvus', 'panaudotas', 'atsauktas');

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.coupon_products (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  kind public.coupon_kind not null,
  service public.coupon_service not null default 'visi',
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 200),
  value numeric(10, 2) not null check (value > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A euro coupon works anywhere; an experience coupon is tied to one service.
  constraint coupon_products_service_matches_kind check ((kind = 'verte') = (service = 'visi'))
);

create trigger coupon_products_updated_at before update on public.coupon_products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders / issued coupons
-- ---------------------------------------------------------------------------

create sequence public.coupon_reference_seq start 1001; -- "KP-1001"

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- 12 chars from an unambiguous alphabet, null until payment is confirmed.
  code text unique check (code ~ '^[2-9A-HJ-NP-Z]{12}$'),
  product_id text not null references public.coupon_products (id) on update cascade on delete restrict,
  -- Snapshots, so editing a product never changes a coupon already sold.
  product_name text not null,
  kind public.coupon_kind not null,
  service public.coupon_service not null,
  face_value numeric(10, 2) not null check (face_value > 0),
  balance numeric(10, 2) not null,
  status public.coupon_status not null default 'laukia_apmokejimo',
  buyer_name text not null check (char_length(buyer_name) between 2 and 80),
  buyer_email text not null check (buyer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(buyer_email) <= 120),
  recipient_name text not null default '' check (char_length(recipient_name) <= 80),
  message text not null default '' check (char_length(message) <= 300),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at date,
  updated_at timestamptz not null default now(),
  constraint coupons_balance_in_range check (balance >= 0 and balance <= face_value),
  constraint coupons_code_when_issued check (status not in ('aktyvus', 'panaudotas') or code is not null),
  constraint coupons_used_means_empty check (status <> 'panaudotas' or balance = 0)
);

create index coupons_status_created_idx on public.coupons (status, created_at desc);
create index coupons_product_idx on public.coupons (product_id);

create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create function public.set_coupon_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := 'KP-' || nextval('public.coupon_reference_seq');
  end if;
  return new;
end;
$$;

create trigger coupons_reference before insert on public.coupons
  for each row execute function public.set_coupon_reference();

-- ---------------------------------------------------------------------------
-- Redemptions
-- ---------------------------------------------------------------------------

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 200),
  booking_id uuid references public.bookings (id) on delete set null,
  redeemed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);
create index coupon_redemptions_booking_idx on public.coupon_redemptions (booking_id);
create index coupon_redemptions_redeemed_by_idx on public.coupon_redemptions (redeemed_by);

-- Spends from the balance. Locks the coupon row so two cashiers can't both
-- spend the same euros. Errors carry a hint the app maps to a message.
create function public.apply_coupon_redemption()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  c public.coupons;
begin
  select * into c from public.coupons where id = new.coupon_id for update;
  if c.status <> 'aktyvus' then
    raise exception 'Coupon is not active' using errcode = '23514', hint = 'coupon_inactive';
  end if;
  if c.expires_at is not null and c.expires_at < current_date then
    raise exception 'Coupon has expired' using errcode = '23514', hint = 'coupon_expired';
  end if;
  if new.amount > c.balance then
    raise exception 'Amount exceeds the coupon balance' using errcode = '23514', hint = 'coupon_balance';
  end if;

  update public.coupons
     set balance = balance - new.amount,
         status = case when balance - new.amount = 0 then 'panaudotas'::public.coupon_status else status end
   where id = c.id;
  return new;
end;
$$;

create trigger coupon_redemptions_apply before insert on public.coupon_redemptions
  for each row execute function public.apply_coupon_redemption();

-- ---------------------------------------------------------------------------
-- Code generation (private: not an RPC)
-- ---------------------------------------------------------------------------

-- 12 chars x 5 bits = 60 bits from gen_random_uuid() (a CSPRNG). Bytes 6 and 8
-- of a v4 uuid carry fixed version/variant bits, so they are skipped.
create function private.generate_coupon_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- 32 symbols: no 0/O/1/I
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  idx integer[] := array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13];
  result text := '';
  i integer;
begin
  foreach i in array idx loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

revoke execute on function private.generate_coupon_code() from public, anon;
grant execute on function private.generate_coupon_code() to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Public checkout: creates an order awaiting payment. The amount always comes
-- from the product row, never from the caller.
create function public.create_coupon_order(
  p_product_id text,
  p_buyer_name text,
  p_buyer_email text,
  p_recipient_name text default '',
  p_message text default ''
)
returns table (id uuid, reference text, amount numeric, product_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.coupon_products;
begin
  select * into p from public.coupon_products where coupon_products.id = p_product_id and active;
  if not found then
    raise exception 'Unknown or inactive product' using errcode = '23503', hint = 'product_unavailable';
  end if;

  -- Cheap brake on form spam: anon can't be rate limited at the edge here.
  if (select count(*) from public.coupons c
       where c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  return query
  insert into public.coupons (product_id, product_name, kind, service, face_value, balance,
                              buyer_name, buyer_email, recipient_name, message)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_message, '')))
  returning coupons.id, coupons.reference, coupons.face_value, coupons.product_name;
end;
$$;

-- Public booking: is this code good, and for what? Returns nothing for unknown,
-- unpaid, spent, cancelled or expired codes, so a wrong guess reveals nothing.
create function public.check_coupon(p_code text)
returns table (balance numeric, service public.coupon_service, expires_at date, product_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.balance, c.service, c.expires_at, c.product_name
  from public.coupons c
  where c.code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
    and c.status = 'aktyvus'
    and c.balance > 0
    and (c.expires_at is null or c.expires_at >= current_date);
$$;

-- Staff confirm payment: issues the code and starts the 12-month validity.
create function public.activate_coupon(p_id uuid)
returns table (code text, expires_at date)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text;
  v_expires date := ((now() at time zone 'Europe/Vilnius')::date + interval '12 months')::date;
begin
  if not (select private.is_staff()) then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  loop
    v_code := private.generate_coupon_code();
    exit when not exists (select 1 from public.coupons c where c.code = v_code);
  end loop;

  return query
  update public.coupons c
     set code = v_code, status = 'aktyvus', paid_at = now(), expires_at = v_expires
   where c.id = p_id and c.status = 'laukia_apmokejimo'
  returning c.code, c.expires_at;

  if not found then
    raise exception 'Order is not awaiting payment' using errcode = '23514', hint = 'coupon_not_pending';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

alter table public.coupon_products enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

revoke all on public.coupons, public.coupon_redemptions from anon;
revoke all on sequence public.coupon_reference_seq from anon;

-- coupon_products: anon sees active ones; staff also sees inactive ones.
create policy "anon read active coupon products" on public.coupon_products
  for select to anon using (active);
create policy "authenticated read coupon products" on public.coupon_products
  for select to authenticated using (active or (select private.is_staff()));
create policy "staff insert coupon products" on public.coupon_products
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff update coupon products" on public.coupon_products
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff delete coupon products" on public.coupon_products
  for delete to authenticated using ((select private.is_staff()));

create policy "staff manage coupons" on public.coupons
  for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "staff manage coupon redemptions" on public.coupon_redemptions
  for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

-- Supabase grants EXECUTE on new public functions to anon/authenticated, so
-- everything that isn't a deliberate RPC is revoked explicitly.
revoke execute on function public.set_coupon_reference() from public, anon, authenticated;
revoke execute on function public.apply_coupon_redemption() from public, anon, authenticated;

revoke execute on function public.create_coupon_order(text, text, text, text, text) from public;
grant execute on function public.create_coupon_order(text, text, text, text, text) to anon, authenticated;

revoke execute on function public.check_coupon(text) from public;
grant execute on function public.check_coupon(text) to anon, authenticated;

revoke execute on function public.activate_coupon(uuid) from public, anon;
grant execute on function public.activate_coupon(uuid) to authenticated;
