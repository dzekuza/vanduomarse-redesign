-- Vanduo Marse: brute-force limits on the /admin sign-in.
-- Every password attempt, e-mail code request and code check is recorded with a hashed IP and a hashed
-- e-mail (never in plain text). The server asks `admin_login_check` before it calls Supabase Auth and
-- refuses when the IP or the e-mail is over its limit:
--   failed password / code checks: 10 per IP and 5 per e-mail in 15 minutes
--   e-mail code requests:          10 per IP and 5 per e-mail in 1 hour
-- Both functions are for the server only (service role).

create table private.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null check (char_length(ip_hash) between 16 and 128),
  email_hash text not null check (char_length(email_hash) between 16 and 128),
  kind text not null check (kind in ('password', 'code_send', 'code_verify')),
  ok boolean not null,
  created_at timestamptz not null default now()
);

alter table private.admin_login_attempts enable row level security;
revoke all on table private.admin_login_attempts from public, anon, authenticated;

create index admin_login_attempts_ip_idx on private.admin_login_attempts (ip_hash, created_at desc);
create index admin_login_attempts_email_idx on private.admin_login_attempts (email_hash, created_at desc);

-- allowed = false when over a limit; retry_after is the seconds until the oldest counted attempt expires.
create function public.admin_login_check(p_ip_hash text, p_email_hash text, p_kind text)
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
  else
    return query select true, 0;
  end if;
end;
$$;

-- Records one attempt. A successful sign-in clears that e-mail's failures; old rows are pruned.
create function public.admin_login_record(p_ip_hash text, p_email_hash text, p_kind text, p_ok boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind not in ('password', 'code_send', 'code_verify') then
    raise exception 'bad kind';
  end if;
  insert into private.admin_login_attempts (ip_hash, email_hash, kind, ok) values (p_ip_hash, p_email_hash, p_kind, p_ok);
  delete from private.admin_login_attempts where created_at < now() - interval '2 days';
  if p_ok and p_kind in ('password', 'code_verify') then
    delete from private.admin_login_attempts
    where email_hash = p_email_hash and kind in ('password', 'code_verify') and not ok;
  end if;
end;
$$;

revoke execute on function public.admin_login_check(text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_login_record(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.admin_login_check(text, text, text) to service_role;
grant execute on function public.admin_login_record(text, text, text, boolean) to service_role;
