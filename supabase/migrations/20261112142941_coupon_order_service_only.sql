-- create_coupon_order is now called only by the server action with the service role (ADR-0076): the per-IP key
-- (p_ip_hash) is computed on the server, so a caller with the anon key can no longer supply or omit it to dodge the cap.
-- A missing hash is refused (fails closed).

create or replace function public.create_coupon_order(
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

  return query
  insert into public.coupons (product_id, product_name, kind, service, face_value, balance,
                              buyer_name, buyer_email, buyer_phone, recipient_name, recipient_email, message, ip_hash)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_recipient_email, '')), btrim(coalesce(p_message, '')), p_ip_hash)
  returning coupons.id, coupons.reference, coupons.face_value, coupons.product_name;
end;
$$;

revoke execute on function public.create_coupon_order(text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_coupon_order(text, text, text, text, text, text, text, text) to service_role;
