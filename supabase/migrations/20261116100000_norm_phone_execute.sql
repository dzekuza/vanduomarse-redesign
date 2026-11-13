-- Staff could not assign a plan, edit a rider or add one: "permission denied for function norm_phone" (42501).
-- 20261113230000 added expression indexes on public.riders that call private.norm_phone, but 20261028150255 had revoked
-- EXECUTE on it from authenticated. Postgres evaluates index expressions as the writing role, so every insert / update
-- on riders by signed-in staff failed. The function is a pure, immutable string normaliser (no table access), so it is
-- safe to let authenticated and service_role run it.
grant execute on function private.norm_phone(text) to authenticated, service_role;
