-- my_coupons() matched a coupon's buyer phone to the account's phone on the LAST 8 DIGITS. That is loose for something
-- that works like cash (the code is returned), so coupons now match on the account's CONFIRMED e-mail only, for both the
-- buyer and the gift recipient.
create or replace function private.coupon_is_buyer(p_coupon uuid)
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
       and lower(btrim(c.buyer_email)) = lower(u.email)
  );
$$;
