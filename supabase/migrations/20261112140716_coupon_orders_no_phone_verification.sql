-- Coupon orders no longer need a verified phone (owner request, ADR-0073).
-- The coupons table keeps an optional buyer_phone, but the insert trigger that
-- demanded a recent SMS verification is dropped. Abuse is still limited by the
-- honeypot and the 100-pending-orders-per-hour brake in create_coupon_order().
-- Every other public form keeps its phone-verification trigger.

drop trigger if exists coupons_phone_verified on public.coupons;
