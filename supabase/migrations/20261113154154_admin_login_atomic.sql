-- Makes the admin sign-in limit atomic. `admin_login_check` used to count and `admin_login_record` to write afterwards, so a
-- burst of parallel guesses could all pass the check before the first was counted. Now the check takes advisory locks (one per IP,
-- one per e-mail, in a fixed order) and writes a reservation row when it lets the try through; the reservation counts as a failure
-- until a successful sign-in clears that IP + e-mail pair's failures (`admin_login_record(..., true)`). Limits are unchanged.
create or replace function public.admin_login_check(p_ip_hash text, p_email_hash text, p_kind text)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_send boolean := p_kind = 'code_send';
  v_window interval := case when p_kind = 'code_send' then interval '1 hour' else interval '15 minutes' end;
  v_ip_max constant integer := 10;
  v_email_max constant integer := 5;
  v_ip_count integer;
  v_email_count integer;
  v_oldest timestamptz;
begin
  if p_kind not in ('password', 'code_send', 'code_verify') then
    raise exception 'bad kind';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('adminlogin:ip:' || p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('adminlogin:email:' || p_email_hash, 0));

  select count(*), min(a.created_at) into v_ip_count, v_oldest
  from private.admin_login_attempts a
  where a.ip_hash = p_ip_hash and a.created_at > now() - v_window
    and (case when v_send then a.kind = 'code_send' else a.kind in ('password', 'code_verify') and not a.ok end);

  select count(*) into v_email_count
  from private.admin_login_attempts a
  where a.email_hash = p_email_hash and a.created_at > now() - v_window
    and (case when v_send then a.kind = 'code_send' else a.kind in ('password', 'code_verify') and not a.ok end);

  if v_email_count >= v_email_max then
    select min(a.created_at) into v_oldest
    from private.admin_login_attempts a
    where a.email_hash = p_email_hash and a.created_at > now() - v_window
      and (case when v_send then a.kind = 'code_send' else a.kind in ('password', 'code_verify') and not a.ok end);
  end if;

  if v_ip_count >= v_ip_max or v_email_count >= v_email_max then
    return query select false, greatest(1, ceil(extract(epoch from v_oldest + v_window - now()))::integer);
    return;
  end if;

  -- Reserve the try now; it stays a failure until the sign-in succeeds.
  insert into private.admin_login_attempts (ip_hash, email_hash, kind, ok) values (p_ip_hash, p_email_hash, p_kind, false);
  delete from private.admin_login_attempts where created_at < now() - interval '2 days';
  return query select true, 0;
end;
$$;

-- The try was counted by the check. A success forgets this IP + e-mail pair's failures; a failure needs nothing more.
create or replace function public.admin_login_record(p_ip_hash text, p_email_hash text, p_kind text, p_ok boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind not in ('password', 'code_send', 'code_verify') then
    raise exception 'bad kind';
  end if;
  if p_ok and p_kind in ('password', 'code_verify') then
    delete from private.admin_login_attempts
    where ip_hash = p_ip_hash and email_hash = p_email_hash and kind in ('password', 'code_verify') and not ok;
  end if;
end;
$$;
