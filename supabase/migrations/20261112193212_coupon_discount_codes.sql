-- Discount codes (ADR-0036) also work on gift coupon purchases: service 'kuponai'. The code lowers what the buyer pays;
-- the coupon keeps its full face value. The price is computed here, never taken from the client, and the Stripe
-- webhook and refund checks compare against face_value - discount_amount.

do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.discount_codes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%pirtis%';
  if c is not null then
    execute format('alter table public.discount_codes drop constraint %I', c);
  end if;
end $$;

alter table public.discount_codes add constraint discount_codes_services_check
  check (cardinality(services) > 0 and services <@ array['pirtis', 'nakvyne', 'keturraciai', 'kuponai']);

alter table public.coupons
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);

create index coupons_discount_code_idx on public.coupons (discount_code_id) where discount_code_id is not null;

-- Requests and coupon orders holding the code that are not cancelled.
create or replace function private.discount_code_uses(p_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select ((select count(*) from public.bookings b where b.discount_code_id = p_id and b.status <> 'atsaukta')
        + (select count(*) from public.quad_rentals q where q.discount_code_id = p_id and q.status <> 'atsaukta')
        + (select count(*) from public.event_tickets t where t.discount_code_id = p_id and t.status <> 'atsaukta')
        + (select count(*) from public.coupons c where c.discount_code_id = p_id and c.status <> 'atsauktas'))::integer;
$$;

drop function public.create_coupon_order(text, text, text, text, text, text, text, text);

create function public.create_coupon_order(
  p_product_id text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_recipient_name text default '',
  p_message text default '',
  p_recipient_email text default '',
  p_ip_hash text default null,
  p_discount_code text default null
)
-- amount: what the buyer pays (face value minus the discount).
returns table (id uuid, reference text, amount numeric, product_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.coupon_products;
  dc record;
  v_discount numeric := 0;
begin
  if p_ip_hash is null or p_ip_hash = '' then
    raise exception 'Missing client key' using errcode = '22023', hint = 'client_key_missing';
  end if;

  select * into p from public.coupon_products where coupon_products.id = p_product_id and active;
  if not found then
    raise exception 'Unknown or inactive product' using errcode = '23503', hint = 'product_unavailable';
  end if;

  -- One visitor cannot hold more than 5 unpaid orders in an hour.
  if (select count(*) from public.coupons c
       where c.ip_hash = p_ip_hash and c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  -- Cheap brake on form spam overall.
  if (select count(*) from public.coupons c
       where c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  select a.code_id, a.code, a.amount into dc from private.apply_discount_code(p_discount_code, 'kuponai', p.value) a;
  if dc.code_id is not null then
    v_discount := dc.amount;
    -- Stripe cannot charge less than 0,50 €.
    if p.value - v_discount < 0.5 then
      raise exception 'Total below the minimum' using errcode = '23514', hint = 'below_minimum';
    end if;
  end if;

  return query
  insert into public.coupons (product_id, product_name, kind, service, face_value, balance,
                              buyer_name, buyer_email, buyer_phone, recipient_name, recipient_email, message, ip_hash,
                              discount_code_id, discount_code, discount_amount)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_recipient_email, '')), btrim(coalesce(p_message, '')), p_ip_hash,
          dc.code_id, dc.code, v_discount)
  returning coupons.id, coupons.reference, coupons.face_value - coupons.discount_amount, coupons.product_name;
end;
$$;

revoke execute on function public.create_coupon_order(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_coupon_order(text, text, text, text, text, text, text, text, text) to service_role;

-- The paid amount must equal face value minus the discount.
create or replace function public.complete_coupon_payment(p_coupon_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
returns table (
  newly_paid boolean, amount_ok boolean, status public.coupon_status, id uuid, reference text, code text, expires_at date,
  buyer_name text, buyer_email text, recipient_name text, recipient_email text, message text,
  product_name text, face_value numeric, service public.coupon_service
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.coupons;
  v_code text;
  v_expires date := ((now() at time zone 'Europe/Vilnius')::date + interval '12 months')::date;
  v_new boolean := false;
begin
  select * into c from public.coupons where coupons.id = p_coupon_id for update;
  if not found then
    return;
  end if;

  if c.status = 'laukia_apmokejimo' and p_amount = c.face_value - c.discount_amount then
    loop
      v_code := private.generate_coupon_code();
      exit when not exists (select 1 from public.coupons x where x.code = v_code);
    end loop;
    update public.coupons
       set code = v_code, status = 'aktyvus', paid_at = now(), expires_at = v_expires,
           stripe_session_id = coalesce(p_session_id, stripe_session_id), stripe_payment_intent_id = p_payment_intent
     where coupons.id = p_coupon_id
    returning * into c;
    v_new := true;
  end if;

  return query select v_new, (p_amount = c.face_value - c.discount_amount), c.status, c.id, c.reference, c.code, c.expires_at,
    c.buyer_name, c.buyer_email, c.recipient_name, c.recipient_email, c.message, c.product_name, c.face_value, c.service;
end;
$$;

-- A full refund (of what was paid) cancels the coupon.
create or replace function public.refund_coupon_payment(p_payment_intent text, p_refunded numeric)
returns text
language sql
security definer
set search_path = ''
as $$
  update public.coupons set status = 'atsauktas'
   where stripe_payment_intent_id = p_payment_intent and status in ('aktyvus') and p_refunded >= face_value - discount_amount
  returning reference;
$$;
