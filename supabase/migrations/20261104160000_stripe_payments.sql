-- Stripe payments for the /rezervacija page (ADR-0026).
--
-- One payment covers every request filed in one reservation (sauna booking, quad
-- rental, stay, program ticket). The requests are created first and hold their slot;
-- the payment then either completes (webhook), or its Checkout Session expires and
-- the requests are cancelled so the slot is released.
--
-- Money state lives only here. The server (service role) reaches it through the
-- scoped functions below, never by querying the tables: anon and signed-in users
-- cannot execute them. Staff read payments through RLS keyed to their page permissions.

-- ---------------------------------------------------------------------------
-- 1. Table and links from the requests
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'laukia' check (status in ('laukia', 'apmoketa', 'pasibaige', 'nepavyko', 'grazinta')),
  amount numeric(10, 2) not null check (amount > 0),
  refunded numeric(10, 2) not null default 0 check (refunded >= 0),
  customer_phone text,
  customer_email text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  expires_at timestamptz,
  paid_at timestamptz,
  -- Paid late (after the slots were released and could not be restored) or for a different
  -- amount than expected: staff must check it and refund if needed.
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payments is 'One Stripe Checkout payment for the requests of one reservation. Written only by the service-role functions below.';
comment on column public.payments.status is 'laukia = waiting for Stripe, apmoketa = paid, pasibaige = session expired or abandoned, nepavyko = async payment failed, grazinta = fully refunded.';

create index payments_stripe_intent_idx on public.payments (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create index payments_status_idx on public.payments (status, created_at);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.bookings add column payment_id uuid references public.payments (id) on delete set null;
alter table public.quad_rentals add column payment_id uuid references public.payments (id) on delete set null;
alter table public.event_tickets add column payment_id uuid references public.payments (id) on delete set null;

create index bookings_payment_idx on public.bookings (payment_id) where payment_id is not null;
create index quad_rentals_payment_idx on public.quad_rentals (payment_id) where payment_id is not null;
create index event_tickets_payment_idx on public.event_tickets (payment_id) where payment_id is not null;

alter table public.payments enable row level security;
revoke all on public.payments from public, anon, authenticated;
grant select on public.payments to authenticated;

create policy "staff read payments" on public.payments
  for select to authenticated
  using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga', 'keturraciai', 'renginiai'])));

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

create function private.payment_paid(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_id is not null and exists (select 1 from public.payments p where p.id = p_id and p.status = 'apmoketa');
$$;

create function private.payment_refs(p_id uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(x.reference order by x.reference), '{}')
  from (
    select reference from public.bookings where payment_id = p_id
    union all select reference from public.quad_rentals where payment_id = p_id
    union all select reference from public.event_tickets where payment_id = p_id
  ) x;
$$;

-- What Checkout charges for: one line per request.
create function private.payment_items(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('reference', x.reference, 'label', x.label, 'amount', x.total) order by x.reference), '[]'::jsonb)
  from (
    select b.reference, case b.kind when 'pirtis' then 'Pirtis' else 'Nakvynė' end as label, b.total
      from public.bookings b where b.payment_id = p_id
    union all
    select q.reference, 'Keturračiai', q.total from public.quad_rentals q where q.payment_id = p_id
    union all
    select t.reference, e.title, t.total
      from public.event_tickets t join public.events e on e.id = t.event_id where t.payment_id = p_id
  ) x;
$$;

-- Ends an unpaid payment and releases what it held. Returns how many requests were cancelled.
create function private.close_payment(p_id uuid, p_to text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  b integer; r integer; t integer;
begin
  select * into p from public.payments where id = p_id for update;
  if not found or p.status <> 'laukia' then
    return 0;
  end if;
  update public.payments set status = p_to where id = p_id;

  update public.bookings set status = 'atsaukta' where payment_id = p_id and status = 'laukia';
  get diagnostics b = row_count;
  update public.quad_rentals set status = 'atsaukta' where payment_id = p_id and status = 'laukia';
  get diagnostics r = row_count;
  update public.event_tickets set status = 'atsaukta' where payment_id = p_id and status = 'laukia';
  get diagnostics t = row_count;
  return b + r + t;
end;
$$;

revoke execute on function private.payment_paid(uuid) from public, anon, authenticated;
revoke execute on function private.payment_refs(uuid) from public, anon, authenticated;
revoke execute on function private.payment_items(uuid) from public, anon, authenticated;
revoke execute on function private.close_payment(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Paid requests are not spam: keep them out of the pending limits
-- ---------------------------------------------------------------------------

create or replace function private.pending_web_requests(p_email text, p_phone text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with contact as (
    select lower(btrim(coalesce(p_email, ''))) as email, private.norm_phone(p_phone) as phone
  ), pending as (
    select customer_email, customer_phone from public.bookings
     where status = 'laukia' and source = 'svetaine' and not private.payment_paid(payment_id)
    union all
    select customer_email, customer_phone from public.event_tickets
     where status = 'laukia' and source = 'svetaine' and not private.payment_paid(payment_id)
    union all
    select customer_email, customer_phone from public.quad_rentals
     where status = 'laukia' and source = 'svetaine' and not private.payment_paid(payment_id)
  )
  select count(*)::integer
  from pending p, contact c
  where (c.email <> '' and lower(btrim(coalesce(p.customer_email, ''))) = c.email)
     or (c.phone <> '' and private.norm_phone(p.customer_phone) = c.phone);
$$;

-- Unanswered web requests expire after 48 hours, but a paid one must wait for staff.
create or replace function public.expire_pending_requests()
returns table (bookings integer, tickets integer, rentals integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  b integer; t integer; r integer;
begin
  update public.bookings set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours'
     and not private.payment_paid(payment_id);
  get diagnostics b = row_count;

  update public.event_tickets set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours'
     and not private.payment_paid(payment_id);
  get diagnostics t = row_count;

  update public.quad_rentals set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours'
     and not private.payment_paid(payment_id);
  get diagnostics r = row_count;

  return query select b, t, r;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Server functions (service role only)
-- ---------------------------------------------------------------------------

-- Groups the pending requests the signed-in customer just filed into one payment, or returns the
-- open payment they already belong to (a retry). Every reference must belong to that account
-- and still be pending; the amount is the sum of the stored totals, never a client value.
create function public.start_payment(p_user uuid, p_refs text[])
returns table (payment_id uuid, amount numeric, expires_at timestamptz, stripe_session_id text, customer_email text, items jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refs text[];
  v_items jsonb;
  v_count integer;
  v_with integer;
  v_distinct integer;
  v_existing uuid;
  v_amount numeric;
  v_email text;
  v_phone text;
  p public.payments;
begin
  if p_user is null then
    raise exception 'No account' using errcode = '23514', hint = 'payment_requests';
  end if;
  select array_agg(distinct r) into v_refs from unnest(p_refs) r where r is not null and btrim(r) <> '';
  if v_refs is null or array_length(v_refs, 1) > 10 then
    raise exception 'Invalid request list' using errcode = '23514', hint = 'payment_requests';
  end if;

  perform pg_advisory_xact_lock(hashtext('pay:' || p_user::text));

  with req as (
    select 'bookings'::text as tbl, b.id, b.reference, b.total,
           case b.kind when 'pirtis' then 'Pirtis' else 'Nakvynė' end as label,
           b.payment_id, b.customer_email as email, b.customer_phone as phone
      from public.bookings b
     where b.reference = any (v_refs) and b.status = 'laukia' and b.source = 'svetaine'
       and b.user_id = p_user
    union all
    select 'quad_rentals', q.id, q.reference, q.total, 'Keturračiai', q.payment_id, q.customer_email, q.customer_phone
      from public.quad_rentals q
     where q.reference = any (v_refs) and q.status = 'laukia' and q.source = 'svetaine'
       and q.user_id = p_user
    union all
    select 'event_tickets', t.id, t.reference, t.total, e.title, t.payment_id, t.customer_email, t.customer_phone
      from public.event_tickets t
      join public.events e on e.id = t.event_id
     where t.reference = any (v_refs) and t.status = 'laukia' and t.source = 'svetaine'
       and t.user_id = p_user
  )
  select jsonb_agg(jsonb_build_object('tbl', f.tbl, 'id', f.id, 'reference', f.reference, 'label', f.label, 'amount', f.total, 'payment_id', f.payment_id)),
         count(*), count(f.payment_id), count(distinct f.payment_id), min(f.payment_id::text)::uuid,
         coalesce(sum(f.total), 0), min(f.email) filter (where btrim(coalesce(f.email, '')) <> ''),
         min(f.phone) filter (where btrim(coalesce(f.phone, '')) <> '')
    into v_items, v_count, v_with, v_distinct, v_existing, v_amount, v_email, v_phone
    from req f;

  if v_count is distinct from array_length(v_refs, 1) then
    raise exception 'Requests not found or no longer pending' using errcode = '23514', hint = 'payment_requests';
  end if;

  if v_with > 0 then
    -- A retry: every request must already sit in the same open payment, and nothing else.
    if v_with <> v_count or v_distinct <> 1 then
      raise exception 'Requests already belong to a payment' using errcode = '23514', hint = 'payment_exists';
    end if;
    select * into p from public.payments where id = v_existing for update;
    if p.status <> 'laukia' or array_length(private.payment_refs(p.id), 1) is distinct from v_count then
      raise exception 'Payment is not open' using errcode = '23514', hint = 'payment_exists';
    end if;
  else
    if v_amount <= 0 then
      raise exception 'Nothing to pay' using errcode = '23514', hint = 'payment_free';
    end if;
    insert into public.payments (user_id, amount, customer_phone, customer_email)
    values (p_user, v_amount, v_phone, v_email)
    returning * into p;

    update public.bookings set payment_id = p.id
     where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'bookings');
    update public.quad_rentals set payment_id = p.id
     where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'quad_rentals');
    update public.event_tickets set payment_id = p.id
     where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'event_tickets');
  end if;

  return query
    select p.id, p.amount, p.expires_at, p.stripe_session_id, p.customer_email, private.payment_items(p.id);
end;
$$;

create function public.attach_payment_session(p_payment_id uuid, p_session_id text, p_expires_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments
     set stripe_session_id = p_session_id, expires_at = p_expires_at
   where id = p_payment_id and status = 'laukia';
  if not found then
    raise exception 'Payment is not open' using errcode = '23514', hint = 'payment_exists';
  end if;
end;
$$;

-- The webhook calls this when Stripe says the Checkout Session is paid. Safe to repeat:
-- only the first call reports newly_paid, so the SMS texts go out once.
create function public.complete_payment(p_session_id text, p_payment_intent text, p_amount numeric)
returns table (newly_paid boolean, payment_id uuid, phone text, amount numeric, refs text[], needs_review boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  v_review boolean := false;
begin
  select * into p from public.payments where stripe_session_id = p_session_id for update;
  if not found then
    return;
  end if;

  if p.status in ('apmoketa', 'grazinta') then
    return query select false, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review;
    return;
  end if;

  if p.status in ('pasibaige', 'nepavyko') then
    -- Paid after we released the slots: bring the requests back if they are still free.
    begin
      update public.bookings bk set status = 'laukia' where bk.payment_id = p.id and bk.status = 'atsaukta';
      update public.quad_rentals qr set status = 'laukia' where qr.payment_id = p.id and qr.status = 'atsaukta';
      update public.event_tickets et set status = 'laukia' where et.payment_id = p.id and et.status = 'atsaukta';
    exception when others then
      v_review := true;
    end;
  end if;

  if p_amount is not null and p_amount <> p.amount then
    v_review := true;
  end if;

  update public.payments pm
     set status = 'apmoketa', paid_at = now(), stripe_payment_intent_id = coalesce(nullif(p_payment_intent, ''), pm.stripe_payment_intent_id),
         needs_review = pm.needs_review or v_review
   where pm.id = p.id
   returning * into p;

  return query select true, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review;
end;
$$;

-- Session expired or an asynchronous payment failed: release the requests (only if it is still the current session).
create function public.expire_payment(p_session_id text, p_failed boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.payments where stripe_session_id = p_session_id;
  if v_id is null then
    return 0;
  end if;
  return private.close_payment(v_id, case when p_failed then 'nepavyko' else 'pasibaige' end);
end;
$$;

-- Starting Checkout failed after the payment was created: release everything it held.
create function public.abandon_payment(p_payment_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  select private.close_payment(p_payment_id, 'pasibaige');
$$;

create function public.record_refund(p_payment_intent text, p_refunded numeric)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
     set refunded = least(p_refunded, amount),
         status = case when p_refunded >= amount then 'grazinta' else status end
   where stripe_payment_intent_id = p_payment_intent;
$$;

-- What the return page and "pay again" need; the payment id in the URL is an unguessable uuid,
-- the page shows no personal data.
create function public.payment_state(p_payment_id uuid)
returns table (status text, amount numeric, paid_at timestamptz, refs text[], needs_review boolean, stripe_session_id text, customer_email text, items jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select p.status, p.amount, p.paid_at, private.payment_refs(p.id), p.needs_review, p.stripe_session_id, p.customer_email, private.payment_items(p.id)
    from public.payments p
   where p.id = p_payment_id;
$$;

-- The customer's requests could not all be filed, or Checkout could not start: cancel the ones
-- that were filed and are not in a payment yet (matched by the account).
create function public.cancel_unpaid_requests(p_user uuid, p_refs text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b integer; q integer; t integer;
begin
  if p_user is null then
    return 0;
  end if;
  update public.bookings set status = 'atsaukta'
   where reference = any (p_refs) and status = 'laukia' and source = 'svetaine' and payment_id is null
     and user_id = p_user;
  get diagnostics b = row_count;
  update public.quad_rentals set status = 'atsaukta'
   where reference = any (p_refs) and status = 'laukia' and source = 'svetaine' and payment_id is null
     and user_id = p_user;
  get diagnostics q = row_count;
  update public.event_tickets set status = 'atsaukta'
   where reference = any (p_refs) and status = 'laukia' and source = 'svetaine' and payment_id is null
     and user_id = p_user;
  get diagnostics t = row_count;
  return b + q + t;
end;
$$;

revoke execute on function public.start_payment(uuid, text[]) from public, anon, authenticated;
revoke execute on function public.attach_payment_session(uuid, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.complete_payment(text, text, numeric) from public, anon, authenticated;
revoke execute on function public.expire_payment(text, boolean) from public, anon, authenticated;
revoke execute on function public.abandon_payment(uuid) from public, anon, authenticated;
revoke execute on function public.record_refund(text, numeric) from public, anon, authenticated;
revoke execute on function public.payment_state(uuid) from public, anon, authenticated;
revoke execute on function public.cancel_unpaid_requests(uuid, text[]) from public, anon, authenticated;
grant execute on function public.start_payment(uuid, text[]) to service_role;
grant execute on function public.attach_payment_session(uuid, text, timestamptz) to service_role;
grant execute on function public.complete_payment(text, text, numeric) to service_role;
grant execute on function public.expire_payment(text, boolean) to service_role;
grant execute on function public.abandon_payment(uuid) to service_role;
grant execute on function public.record_refund(text, numeric) to service_role;
grant execute on function public.payment_state(uuid) to service_role;
grant execute on function public.cancel_unpaid_requests(uuid, text[]) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Safety net: release payments nobody finished
-- ---------------------------------------------------------------------------

-- The Checkout Session lasts 30 minutes and Stripe tells us when it expires; if that event is
-- ever lost, this frees the slots half an hour later.
create function private.expire_stale_payments()
returns integer
language sql
security definer
set search_path = ''
as $$
  select coalesce(sum(private.close_payment(p.id, 'pasibaige')), 0)::integer
    from public.payments p
   where p.status = 'laukia'
     and coalesce(p.expires_at, p.created_at + interval '30 minutes') < now() - interval '30 minutes';
$$;

revoke execute on function private.expire_stale_payments() from public, anon, authenticated;

select cron.schedule('expire-stale-payments', '*/10 * * * *', $$select private.expire_stale_payments()$$);
