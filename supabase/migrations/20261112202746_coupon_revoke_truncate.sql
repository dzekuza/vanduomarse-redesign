-- The append-only and money-column triggers do not fire on TRUNCATE, and Supabase grants TRUNCATE, REFERENCES and TRIGGER on
-- public tables to the API roles by default. Signed-in staff and anon visitors have no use for them on coupon money tables:
-- take them away (SELECT/INSERT/UPDATE/DELETE and row level security are unchanged).
revoke truncate, references, trigger on public.coupons from public, anon, authenticated;
revoke truncate, references, trigger on public.coupon_redemptions from public, anon, authenticated;
revoke truncate, references, trigger on public.coupon_refunds from public, anon, authenticated;
