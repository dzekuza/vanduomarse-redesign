-- Vanduo Marse: verify the visitor's phone by SMS before a public booking.
-- The server sends a 6-digit code (stored only as an HMAC, never in plain
-- text), the visitor types it back, and every web request filed by the
-- anonymous role must carry a phone that was verified in the last hour.
--
-- The code functions are called only by the server (service role) with the
-- client IP already hashed; anon cannot reach them. The insert trigger is the
-- backstop for anyone calling the public booking functions directly.

-- ---------------------------------------------------------------------------
-- 1. Codes
-- ---------------------------------------------------------------------------

create table private.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  -- Canonical digits (private.norm_phone), e.g. 37061234567.
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  ip_hash text not null check (char_length(ip_hash) between 16 and 128),
  code_hash text not null check (char_length(code_hash) between 32 and 128),
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz
);

alter table private.phone_verifications enable row level security;
revoke all on table private.phone_verifications from public, anon, authenticated;

create index phone_verifications_phone_idx on private.phone_verifications (phone, created_at desc);
create index phone_verifications_ip_idx on private.phone_verifications (ip_hash, created_at desc);
create index phone_verifications_created_idx on private.phone_verifications (created_at);

-- Store a new code if the phone, the IP and the whole site are under their send limits.
-- reason is null when stored; otherwise phone_cooldown (retry_after seconds), phone_limit, ip_limit or busy.
create function public.request_phone_code(p_phone text, p_ip_hash text, p_code_hash text)
returns table (reason text, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := private.norm_phone(p_phone);
  v_last timestamptz;
begin
  if v_phone !~ '^[0-9]{10,15}$' then
    return query select 'phone_invalid'::text, 0;
    return;
  end if;

  -- One send at a time site-wide, so none of the counts below (phone, IP, global)
  -- can be raced. Sends are rare and the lock is held for a few queries only.
  perform pg_advisory_xact_lock(hashtext('phone_code'));

  select max(v.created_at) into v_last from private.phone_verifications v where v.phone = v_phone;
  if v_last > now() - interval '60 seconds' then
    return query select 'phone_cooldown'::text, ceil(extract(epoch from v_last + interval '60 seconds' - now()))::integer;
    return;
  end if;

  if (select count(*) from private.phone_verifications v where v.phone = v_phone and v.created_at > now() - interval '1 hour') >= 3
     or (select count(*) from private.phone_verifications v where v.phone = v_phone and v.created_at > now() - interval '24 hours') >= 5 then
    return query select 'phone_limit'::text, 0;
    return;
  end if;

  if (select count(*) from private.phone_verifications v where v.ip_hash = p_ip_hash and v.created_at > now() - interval '1 hour') >= 10
     or (select count(*) from private.phone_verifications v where v.ip_hash = p_ip_hash and v.created_at > now() - interval '24 hours') >= 20 then
    return query select 'ip_limit'::text, 0;
    return;
  end if;

  -- Site-wide brake against SMS pumping from many IPs.
  if (select count(*) from private.phone_verifications v where v.created_at > now() - interval '1 hour') >= 200 then
    return query select 'busy'::text, 0;
    return;
  end if;

  -- Only the newest code counts.
  update private.phone_verifications v set expires_at = now()
   where v.phone = v_phone and v.verified_at is null and v.expires_at > now();

  insert into private.phone_verifications (phone, ip_hash, code_hash, expires_at)
  values (v_phone, p_ip_hash, p_code_hash, now() + interval '10 minutes');

  return query select null::text, 0;
end;
$$;

-- Check a typed code against the newest live one: ok, invalid, expired or locked (5 wrong tries).
create function public.verify_phone_code(p_phone text, p_code_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := private.norm_phone(p_phone);
  v private.phone_verifications;
begin
  select * into v from private.phone_verifications pv
   where pv.phone = v_phone and pv.verified_at is null and pv.expires_at > now()
   order by pv.created_at desc
   limit 1
   for update;
  if not found then
    return 'expired';
  end if;
  if v.attempts >= 5 then
    return 'locked';
  end if;

  if v.code_hash = p_code_hash then
    update private.phone_verifications set verified_at = now() where id = v.id;
    return 'ok';
  end if;

  update private.phone_verifications set attempts = attempts + 1 where id = v.id;
  return case when v.attempts + 1 >= 5 then 'locked' else 'invalid' end;
end;
$$;

-- The SMS did not go out: kill that code and lift the 60 s cooldown so the visitor
-- can retry at once. The row still counts toward the hourly and daily caps, so a
-- number Twilio keeps rejecting cannot be hammered.
create function public.cancel_phone_code(p_phone text, p_code_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.phone_verifications v
     set expires_at = now(), created_at = v.created_at - interval '60 seconds'
   where v.phone = private.norm_phone(p_phone) and v.code_hash = p_code_hash and v.verified_at is null;
$$;

revoke execute on function public.request_phone_code(text, text, text) from public, anon, authenticated;
revoke execute on function public.verify_phone_code(text, text) from public, anon, authenticated;
revoke execute on function public.cancel_phone_code(text, text) from public, anon, authenticated;
grant execute on function public.request_phone_code(text, text, text) to service_role;
grant execute on function public.verify_phone_code(text, text) to service_role;
grant execute on function public.cancel_phone_code(text, text) to service_role;

-- Rows only matter for the 24-hour limits.
select cron.schedule('purge-phone-verifications', '17 3 * * *',
  $$delete from private.phone_verifications where created_at < now() - interval '2 days'$$);

-- ---------------------------------------------------------------------------
-- 2. Web requests need a verified phone
-- ---------------------------------------------------------------------------

create function private.phone_recently_verified(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.phone_verifications v
     where v.phone = private.norm_phone(p_phone)
       -- The server's token lasts 60 minutes; a little slack for clock drift.
       and v.verified_at > now() - interval '65 minutes'
  );
$$;

revoke execute on function private.phone_recently_verified(text) from public, anon, authenticated;

-- Every API caller except active staff: anon, and any signed-in non-staff user
-- (sign-ups may be open). The server (service role) and SQL without a JWT
-- (migrations, cron, seed) are untouched.
create function private.require_verified_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or private.is_staff() then
    return new;
  end if;

  case tg_table_name
    when 'coupons' then
      v_phone := new.buyer_phone;
    when 'inquiries' then
      if new.source <> 'renginys' then
        return new;
      end if;
      v_phone := new.customer_phone;
    else
      if new.source <> 'svetaine' then
        return new;
      end if;
      v_phone := new.customer_phone;
  end case;

  if not private.phone_recently_verified(v_phone) then
    raise exception 'Phone number not verified' using errcode = '42501', hint = 'phone_unverified';
  end if;
  return new;
end;
$$;

revoke execute on function private.require_verified_phone() from public, anon, authenticated;

create trigger bookings_phone_verified before insert on public.bookings
  for each row execute function private.require_verified_phone();
create trigger event_tickets_phone_verified before insert on public.event_tickets
  for each row execute function private.require_verified_phone();
create trigger quad_rentals_phone_verified before insert on public.quad_rentals
  for each row execute function private.require_verified_phone();
create trigger inquiries_phone_verified before insert on public.inquiries
  for each row execute function private.require_verified_phone();

-- ---------------------------------------------------------------------------
-- 3. Coupon orders carry the buyer's (verified) phone
-- ---------------------------------------------------------------------------

alter table public.coupons add column buyer_phone text check (char_length(buyer_phone) <= 30);

create trigger coupons_phone_verified before insert on public.coupons
  for each row execute function private.require_verified_phone();

drop function public.create_coupon_order(text, text, text, text, text);

create function public.create_coupon_order(
  p_product_id text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_recipient_name text default '',
  p_message text default ''
)
returns table (id uuid, reference text, amount numeric, product_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.coupon_products;
begin
  select * into p from public.coupon_products where coupon_products.id = p_product_id and active;
  if not found then
    raise exception 'Unknown or inactive product' using errcode = '23503', hint = 'product_unavailable';
  end if;

  -- Cheap brake on form spam: anon can't be rate limited at the edge here.
  if (select count(*) from public.coupons c
       where c.status = 'laukia_apmokejimo' and c.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending orders' using errcode = '54000', hint = 'too_many_orders';
  end if;

  return query
  insert into public.coupons (product_id, product_name, kind, service, face_value, balance,
                              buyer_name, buyer_email, buyer_phone, recipient_name, message)
  values (p.id, p.name, p.kind, p.service, p.value, p.value,
          btrim(p_buyer_name), btrim(p_buyer_email), nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          btrim(coalesce(p_recipient_name, '')), btrim(coalesce(p_message, '')))
  returning coupons.id, coupons.reference, coupons.face_value, coupons.product_name;
end;
$$;

revoke execute on function public.create_coupon_order(text, text, text, text, text, text) from public;
grant execute on function public.create_coupon_order(text, text, text, text, text, text) to anon, authenticated;
