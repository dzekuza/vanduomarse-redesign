-- Coupon orders are bought and paid by the buyer with no staff step (ADR-0076). Abuse guards:
-- a per-IP cap on unpaid orders (the IP is stored only as an HMAC), and a way to drop an order whose
-- Stripe Checkout could not be opened. The global cap stays as a last-resort brake.

alter table public.coupons add column ip_hash text;
create index coupons_ip_hash_idx on public.coupons (ip_hash, created_at) where ip_hash is not null;

drop function public.create_coupon_order(text, text, text, text, text, text, text);

create function public.create_coupon_order(
  p_product_id text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_recipient_name text default '',
  p_message text default '',
  p_recipient_email text default '',
  p_ip_hash text default null
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

  -- One visitor cannot hold more than 5 unpaid orders in an hour.
  if p_ip_hash is not null and (select count(*) from public.coupons c
       where c.ip_hash = p_ip_hash and c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  -- Cheap brake on form spam overall.
  if (select count(*) from public.coupons c
       where c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  return query
  insert into public.coupons (product_id, product_name, kind, service, face_value, balance,
                              buyer_name, buyer_email, buyer_phone, recipient_name, recipient_email, message, ip_hash)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_recipient_email, '')), btrim(coalesce(p_message, '')), p_ip_hash)
  returning coupons.id, coupons.reference, coupons.face_value, coupons.product_name;
end;
$$;

revoke execute on function public.create_coupon_order(text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_coupon_order(text, text, text, text, text, text, text, text) to anon, authenticated;

-- Checkout could not be opened for a fresh order: drop it so nothing waits for payment that cannot happen.
create function public.abandon_coupon_order(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.coupons set status = 'atsauktas'
   where id = p_coupon_id and status = 'laukia_apmokejimo' and stripe_session_id is null;
$$;

revoke execute on function public.abandon_coupon_order(uuid) from public, anon, authenticated;
grant execute on function public.abandon_coupon_order(uuid) to service_role;
