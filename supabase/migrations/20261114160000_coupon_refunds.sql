-- Money returned to the buyer of a coupon paid online (Stripe). Set by the admin "Grąžinti pinigus" action after Stripe
-- accepted the refund; the coupon itself stays 'atsauktas'. 0 = nothing refunded.
alter table public.coupons
  add column refunded_amount numeric(10, 2) not null default 0 check (refunded_amount >= 0),
  add column refunded_at timestamptz;
