-- Gift coupons can carry the recipient's email, so the code is sent to the buyer and the recipient (ADR-0074).
-- The new argument has a default, so callers that omit it (older deploys) keep working.

alter table public.coupons
  add column recipient_email text not null default '' check (char_length(recipient_email) <= 120);

drop function public.create_coupon_order(text, text, text, text, text, text);

create function public.create_coupon_order(
  p_product_id text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_recipient_name text default '',
  p_message text default '',
  p_recipient_email text default ''
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
                              buyer_name, buyer_email, buyer_phone, recipient_name, recipient_email, message)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_recipient_email, '')), btrim(coalesce(p_message, '')))
  returning coupons.id, coupons.reference, coupons.face_value, coupons.product_name;
end;
$$;

revoke execute on function public.create_coupon_order(text, text, text, text, text, text, text) from public;
grant execute on function public.create_coupon_order(text, text, text, text, text, text, text) to anon, authenticated;
