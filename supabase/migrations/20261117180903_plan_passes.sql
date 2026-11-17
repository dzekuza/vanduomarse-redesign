-- Paid bracelet plans that are not attached to a rider yet (ADR-0109).
-- A buyer pays for a WAKE pass with only a name and an e-mail: no registration first. The webhook marks the pass paid and
-- gives it a 12-character code (the same alphabet as coupon codes). The pass is emailed to the buyer, for themselves or as
-- a gift ("Perku draugui"). At the park, staff attach it to a rider whose registration is finished (profile photo and signed
-- rules) with redeem_plan_pass(); that sets riders.plan_id and logs the purchase, like a sale at the till.
-- Passes are service-role only for writes (the buy action and the webhook); staff with the Apyrankės page can read them.

create table public.plan_passes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- Null until payment is confirmed; the bearer secret staff type in at the park.
  code text unique check (code is null or code ~ '^[2-9A-HJ-NP-Z]{12}$'),
  plan_id uuid references public.ride_plans (id) on delete set null,
  plan_name text not null,
  plan_category text not null,
  -- What the buyer pays (plan price minus the discount).
  price numeric(10, 2) not null check (price > 0),
  discount_code_id uuid references public.discount_codes (id) on delete set null,
  discount_code text,
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  buyer_name text not null check (char_length(buyer_name) between 2 and 80),
  buyer_email text not null check (buyer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(buyer_email) <= 120),
  gift boolean not null default false,
  recipient_name text not null default '' check (char_length(recipient_name) <= 80),
  status text not null default 'laukia_apmokejimo' check (status in ('laukia_apmokejimo', 'apmoketa', 'priskirtas', 'atsauktas')),
  -- HMAC of the buyer's IP, only for the cap on unpaid passes.
  ip_hash text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  rider_id uuid references public.riders (id) on delete set null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users (id) on delete set null,
  purchase_id uuid references public.purchases (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint plan_passes_code_when_paid check (status in ('laukia_apmokejimo', 'atsauktas') or code is not null),
  -- The Black Friday code is only for the WAKE season pass and is always 10 % (same rule as rider_plan_orders).
  constraint plan_passes_wake_black_friday_check check (
    discount_code is distinct from 'WAKEBLACKFRIDAY2026' or (
      plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
      and discount_amount = round((price + discount_amount) * 0.10, 2)
    )
  )
);
create index plan_passes_status_idx on public.plan_passes (status, created_at desc);
create index plan_passes_ip_idx on public.plan_passes (ip_hash, created_at) where ip_hash is not null;
create index plan_passes_discount_idx on public.plan_passes (discount_code_id) where discount_code_id is not null;
create index plan_passes_rider_idx on public.plan_passes (rider_id) where rider_id is not null;
create index plan_passes_intent_idx on public.plan_passes (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

alter table public.plan_passes enable row level security;
revoke all on public.plan_passes from anon, authenticated;
grant select on public.plan_passes to authenticated;
create policy "apyrankes plan passes read" on public.plan_passes
  for select to authenticated using ((select private.has_permission('apyrankes')));

-- ---------------------------------------------------------------------------
-- Discount code usage counts passes too (a code with a use limit, and the Nuolaidos report).
-- ---------------------------------------------------------------------------

create or replace function private.discount_code_uses(p_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select ((select count(*) from public.bookings b where b.discount_code_id = p_id and b.status <> 'atsaukta')
        + (select count(*) from public.quad_rentals q where q.discount_code_id = p_id and q.status <> 'atsaukta')
        + (select count(*) from public.event_tickets t where t.discount_code_id = p_id and t.status <> 'atsaukta')
        + (select count(*) from public.coupons c where c.discount_code_id = p_id and c.status <> 'atsauktas')
        + (select count(*) from public.rider_plan_orders o where o.discount_code_id = p_id and o.status <> 'atsauktas')
        + (select count(*) from public.plan_passes s where s.discount_code_id = p_id and s.status <> 'atsauktas'))::integer;
$$;

create or replace function public.discount_code_usage()
returns table (code_id uuid, uses integer, discount_total numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('nuolaidos') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select d.id, private.discount_code_uses(d.id),
           coalesce((select sum(r.amount) from (
              select b.discount_amount as amount from public.bookings b where b.discount_code_id = d.id and b.status <> 'atsaukta'
              union all
              select q.discount_amount from public.quad_rentals q where q.discount_code_id = d.id and q.status <> 'atsaukta'
              union all
              select t.discount_amount from public.event_tickets t where t.discount_code_id = d.id and t.status <> 'atsaukta'
              union all
              select c.discount_amount from public.coupons c where c.discount_code_id = d.id and c.status <> 'atsauktas'
              union all
              select o.discount_amount from public.rider_plan_orders o where o.discount_code_id = d.id and o.status <> 'atsauktas'
              union all
              select s.discount_amount from public.plan_passes s where s.discount_code_id = d.id and s.status <> 'atsauktas'
            ) r), 0)
    from public.discount_codes d;
end;
$$;

-- ---------------------------------------------------------------------------
-- Buying: a new unpaid pass (service role only, called by the buy action)
-- ---------------------------------------------------------------------------

create function public.create_plan_pass(
  p_plan_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_gift boolean default false,
  p_recipient_name text default '',
  p_discount_code text default null,
  p_ip_hash text default null
)
returns table (id uuid, reference text, plan_name text, price numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.ride_plans;
  v_ref text;
  v_id uuid;
  dc record;
  v_discount numeric := 0;
begin
  select * into v_plan from public.ride_plans p
   where p.id = p_plan_id and p.active and p.sold_online and p.price is not null and p.price > 0;
  if not found then
    raise exception 'Plan is not sold online' using errcode = '23514', hint = 'plan_unavailable';
  end if;

  -- One visitor cannot hold more than 5 unpaid passes in an hour.
  if p_ip_hash is not null and (select count(*) from public.plan_passes s
       where s.ip_hash = p_ip_hash and s.status = 'laukia_apmokejimo' and s.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many pending passes' using errcode = '54000', hint = 'too_many_orders';
  end if;
  -- Last-resort brake on form spam overall (high: a campaign day has many people paying at once).
  if (select count(*) from public.plan_passes s
       where s.status = 'laukia_apmokejimo' and s.created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Too many pending passes' using errcode = '54000', hint = 'too_many_orders';
  end if;

  select a.code_id, a.code, a.amount into dc from private.apply_discount_code(p_discount_code, 'planai', v_plan.price) a;
  if dc.code_id is not null then
    v_discount := dc.amount;
    if v_plan.price - v_discount < 0.5 then
      raise exception 'Total below the minimum' using errcode = '23514', hint = 'below_minimum';
    end if;
  end if;

  loop
    v_ref := 'PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.plan_passes s where s.reference = v_ref);
  end loop;
  insert into public.plan_passes (reference, plan_id, plan_name, plan_category, price, discount_code_id, discount_code, discount_amount,
                                  buyer_name, buyer_email, gift, recipient_name, ip_hash)
  values (v_ref, v_plan.id, v_plan.name, v_plan.category, v_plan.price - v_discount, dc.code_id, dc.code, v_discount,
          btrim(p_buyer_name), lower(btrim(p_buyer_email)), coalesce(p_gift, false), btrim(coalesce(p_recipient_name, '')), p_ip_hash)
  returning plan_passes.id into v_id;
  return query select v_id, v_ref, v_plan.name, v_plan.price - v_discount;
end;
$$;

create function public.attach_plan_pass_session(p_pass_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.plan_passes set stripe_session_id = p_session_id
   where plan_passes.id = p_pass_id and plan_passes.status = 'laukia_apmokejimo';
  if not found then
    raise exception 'Pass is not awaiting payment' using errcode = '23514', hint = 'order_not_pending';
  end if;
end;
$$;

-- Checkout could not open: drop the unpaid pass.
create function public.abandon_plan_pass(p_pass_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.plan_passes set status = 'atsauktas'
   where id = p_pass_id and status = 'laukia_apmokejimo' and stripe_session_id is null;
$$;

-- ---------------------------------------------------------------------------
-- Stripe webhook side (service role only)
-- ---------------------------------------------------------------------------

-- Paid session: the pass gets its code, once. Safe to repeat (only the first call reports newly_paid). A paid amount that
-- differs from the price changes nothing and reports amount_ok = false so staff can check it.
create function public.complete_plan_pass_payment(p_pass_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
returns table (
  newly_paid boolean, amount_ok boolean, order_status text, reference text, pass_code text,
  buyer_name text, buyer_email text, plan_name text, price numeric, gift boolean, recipient_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.plan_passes;
  v_code text;
  v_new boolean := false;
begin
  select * into o from public.plan_passes x where x.id = p_pass_id for update;
  if not found then
    return;
  end if;

  if o.status = 'laukia_apmokejimo' and p_amount = o.price then
    loop
      v_code := private.generate_coupon_code();
      exit when not exists (select 1 from public.plan_passes s where s.code = v_code);
    end loop;
    update public.plan_passes p
       set status = 'apmoketa', paid_at = now(), code = v_code,
           stripe_session_id = coalesce(p_session_id, p.stripe_session_id), stripe_payment_intent_id = p_payment_intent
     where p.id = p_pass_id
    returning * into o;
    v_new := true;
  end if;

  return query select v_new, (p_amount = o.price), o.status, o.reference, o.code,
    o.buyer_name, o.buyer_email, o.plan_name, o.price, o.gift, o.recipient_name;
end;
$$;

-- The Checkout Session expired unpaid: the pass is cancelled.
create function public.expire_plan_pass_session(p_session_id text)
returns integer
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.plan_passes set status = 'atsauktas'
     where stripe_session_id = p_session_id and status = 'laukia_apmokejimo'
    returning 1
  )
  select count(*)::integer from u;
$$;

-- A full refund cancels an unredeemed pass (its code stops working). A pass already attached to a rider is left as it is and
-- reported, so staff can change the rider's plan by hand. Returns nothing for a payment that is not a pass.
create function public.refund_plan_pass_payment(p_payment_intent text, p_refunded numeric)
returns table (reference text, was_attached boolean)
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.plan_passes p
       set status = case when p.status = 'apmoketa' then 'atsauktas' else p.status end
     where p.stripe_payment_intent_id = p_payment_intent and p.status in ('apmoketa', 'priskirtas') and p_refunded >= p.price
    returning p.reference, (p.status = 'priskirtas') as was_attached
  )
  select u.reference, u.was_attached from u;
$$;

-- ---------------------------------------------------------------------------
-- What the payment return page shows (orders and passes), keyed by the unguessable Checkout Session id
-- ---------------------------------------------------------------------------

drop function if exists public.plan_order_state(text);

create function public.plan_order_state(p_session_id text)
returns table (status text, reference text, plan_name text, price numeric, rider_email text, discount_code text, kind text, pass_code text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.status, o.reference, o.plan_name, o.price, coalesce(r.email, ''), o.discount_code, 'order'::text, null::text
    from public.rider_plan_orders o join public.riders r on r.id = o.rider_id
   where o.stripe_session_id = p_session_id
  union all
  -- An attached pass is still a paid pass to the buyer.
  select case when s.status = 'priskirtas' then 'apmoketa' else s.status end, s.reference, s.plan_name, s.price, s.buyer_email, s.discount_code, 'pass'::text,
         case when s.status in ('apmoketa', 'priskirtas') then s.code else null end
    from public.plan_passes s
   where s.stripe_session_id = p_session_id;
$$;

-- ---------------------------------------------------------------------------
-- Staff: attach a paid pass to a rider at the park
-- ---------------------------------------------------------------------------

-- Needs the Apyrankės page permission. The rider must have finished /registracija (profile photo and a signed waiver): that
-- is the gate before a bracelet. A rider who already has a plan is refused unless p_replace says staff chose to replace it.
-- Sets riders.plan_id and logs the purchase (paid by card online) just like a sale at the till.
create function public.redeem_plan_pass(p_pass_id uuid, p_rider_id uuid, p_replace boolean default false)
returns table (purchase_id uuid, sold_at timestamptz, plan_id uuid, plan_name text, plan_category text, price numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.plan_passes;
  r public.riders;
  v_purchase uuid;
  v_sold_at timestamptz;
begin
  if not private.has_permission('apyrankes') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select * into o from public.plan_passes x where x.id = p_pass_id for update;
  if not found then
    raise exception 'Unknown pass' using errcode = '23514', hint = 'pass_unknown';
  end if;
  if o.status <> 'apmoketa' then
    raise exception 'Pass is not available' using errcode = '23514', hint = 'pass_not_available';
  end if;
  if o.plan_id is null then
    raise exception 'Plan no longer exists' using errcode = '23514', hint = 'plan_unavailable';
  end if;

  select * into r from public.riders x where x.id = p_rider_id for update;
  if not found then
    raise exception 'Unknown rider' using errcode = '23514', hint = 'rider_unknown';
  end if;
  if not (r.avatar_path is not null and exists (
       select 1 from public.rider_waivers w where w.rider_id = r.id and w.signature_path is not null)) then
    raise exception 'Rider has not finished registration' using errcode = '23514', hint = 'rider_not_registered';
  end if;
  if r.plan_id is not null and not coalesce(p_replace, false) then
    raise exception 'Rider already has a plan' using errcode = '23514', hint = 'rider_has_plan';
  end if;

  update public.riders set plan_id = o.plan_id where riders.id = r.id;
  insert into public.purchases (rider_id, plan_id, plan_name, plan_category, price, sold_by, payment_method)
  values (r.id, o.plan_id, o.plan_name, o.plan_category, o.price, (select auth.uid()), 'kortele')
  returning purchases.id, purchases.sold_at into v_purchase, v_sold_at;
  update public.plan_passes set status = 'priskirtas', rider_id = r.id, redeemed_at = now(), redeemed_by = (select auth.uid()), purchase_id = v_purchase
   where plan_passes.id = o.id;

  return query select v_purchase, v_sold_at, o.plan_id, o.plan_name, o.plan_category, o.price;
end;
$$;

revoke execute on function public.create_plan_pass(uuid, text, text, boolean, text, text, text) from public, anon, authenticated;
revoke execute on function public.attach_plan_pass_session(uuid, text) from public, anon, authenticated;
revoke execute on function public.abandon_plan_pass(uuid) from public, anon, authenticated;
revoke execute on function public.complete_plan_pass_payment(uuid, text, text, numeric) from public, anon, authenticated;
revoke execute on function public.expire_plan_pass_session(text) from public, anon, authenticated;
revoke execute on function public.refund_plan_pass_payment(text, numeric) from public, anon, authenticated;
revoke execute on function public.plan_order_state(text) from public, anon, authenticated;
revoke execute on function public.redeem_plan_pass(uuid, uuid, boolean) from public, anon;
grant execute on function public.create_plan_pass(uuid, text, text, boolean, text, text, text) to service_role;
grant execute on function public.attach_plan_pass_session(uuid, text) to service_role;
grant execute on function public.abandon_plan_pass(uuid) to service_role;
grant execute on function public.complete_plan_pass_payment(uuid, text, text, numeric) to service_role;
grant execute on function public.expire_plan_pass_session(text) to service_role;
grant execute on function public.refund_plan_pass_payment(text, numeric) to service_role;
grant execute on function public.plan_order_state(text) to service_role;
grant execute on function public.redeem_plan_pass(uuid, uuid, boolean) to authenticated;
