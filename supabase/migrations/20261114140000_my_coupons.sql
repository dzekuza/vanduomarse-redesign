-- "Kuponai" on /paskyra: the paid gift coupons that belong to the signed-in account, meaning coupons bought with, or
-- sent to, the account's CONFIRMED e-mail (or bought with its confirmed phone, last 8 digits). Same trust rule as
-- my_riders(): an unconfirmed address never shows anyone's coupons. Unpaid and cancelled orders are not listed.
-- The code is returned because the account owner is the buyer or the recipient.
-- Whether the signed-in, confirmed account is the buyer / the gift recipient of a coupon.
create function private.coupon_is_buyer(p_coupon uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coupons c
      join auth.users u on u.id = (select auth.uid())
     where c.id = p_coupon
       and (
         (u.email_confirmed_at is not null and lower(btrim(c.buyer_email)) = lower(u.email))
         or (
           u.phone_confirmed_at is not null
           and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 8
           and right(regexp_replace(coalesce(c.buyer_phone, ''), '\D', '', 'g'), 8) = right(regexp_replace(u.phone, '\D', '', 'g'), 8)
         )
       )
  );
$$;

create function private.coupon_is_recipient(p_coupon uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coupons c
      join auth.users u on u.id = (select auth.uid())
     where c.id = p_coupon
       and u.email_confirmed_at is not null
       and c.recipient_email <> ''
       and lower(btrim(c.recipient_email)) = lower(u.email)
  );
$$;

create or replace function public.my_coupons()
returns table (
  reference text, product_name text, face_value numeric, balance numeric, status public.coupon_status,
  code text, expires_at date, service public.coupon_service, role text, buyer_name text, recipient_name text,
  message text, paid_at timestamptz, session_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.reference, c.product_name, c.face_value, c.balance, c.status, c.code, c.expires_at, c.service,
         case when private.coupon_is_buyer(c.id) then 'buyer' else 'recipient' end,
         c.buyer_name, c.recipient_name, c.message, c.paid_at,
         case when private.coupon_is_buyer(c.id) then c.stripe_session_id end
    from public.coupons c
   where c.status in ('aktyvus', 'panaudotas')
     and (private.coupon_is_buyer(c.id) or private.coupon_is_recipient(c.id))
   order by c.paid_at desc nulls last;
$$;

revoke execute on function private.coupon_is_buyer(uuid) from public, anon, authenticated;
revoke execute on function private.coupon_is_recipient(uuid) from public, anon, authenticated;
revoke execute on function public.my_coupons() from public, anon;
grant execute on function public.my_coupons() to authenticated;
