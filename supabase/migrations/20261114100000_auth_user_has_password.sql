-- Lets the owner-only staff action know whether an existing login (e.g. a customer who signs in with a code)
-- already has a password, so granting it staff access can set one only when needed. Service role only.
create or replace function public.auth_user_has_password(p_user uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce((select u.encrypted_password is not null and u.encrypted_password <> '' from auth.users u where u.id = p_user), false);
$$;

revoke all on function public.auth_user_has_password(uuid) from public, anon, authenticated;
grant execute on function public.auth_user_has_password(uuid) to service_role;
