-- Test-only phone skip (ADR-0023): lets the server record a verified phone without an SMS code
-- while PHONE_VERIFICATION_SKIP=1 is set. The server (service role) is the only caller; anon and
-- signed-in users cannot execute it, so the phone gate stays closed unless the server opens it.
create function public.record_skipped_phone(p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := private.norm_phone(p_phone);
begin
  if v_phone is null then
    raise exception 'phone_invalid';
  end if;
  insert into private.phone_verifications (phone, ip_hash, code_hash, expires_at, verified_at)
  values (v_phone, repeat('s', 16), repeat('s', 32), now(), now());
end;
$$;

revoke execute on function public.record_skipped_phone(text) from public, anon, authenticated;
grant execute on function public.record_skipped_phone(text) to service_role;
