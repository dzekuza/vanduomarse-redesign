-- Vanduo Marse: "Mokėjimas dalimis" for the WAKE season pass bought online (ADR-0139, builds on ADR-0109).
--
-- The buyer may pay the WAKE season pass in two halves of the final price (after any discount): deposit = round(price / 2, 2)
-- now through Stripe Checkout, balance = price - deposit later through a link staff send from /admin (no deadline). Both halves
-- must be at least 0.50 EUR. A paid deposit moves the pass to the new status `dalinai_apmoketa` and issues NO code; the paid
-- balance moves it to `apmoketa` and issues the code exactly as a full payment does. Only the WAKE season pass
-- (52e95927-7591-4feb-99b4-1b92c878ca6c, the same id the Black Friday checks use) can be split.
--
-- Additive: new columns with defaults, the status / code checks widened, functions replaced with signatures that keep the old
-- named calls working (new parameters have defaults, new result columns are appended), so the code deployed before this
-- migration keeps working. Grants follow the existing plan pass functions: service role only, staff permission is checked by
-- the server action before the service-role call (as for staff payment links, ADR-0112).

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.plan_passes
  add column payment_plan text not null default 'visa',
  -- Both null for a full payment; for "dalimis" they add up to the price.
  add column deposit_amount numeric(10, 2),
  add column balance_amount numeric(10, 2),
  -- The balance is paid through its own Checkout Session (about a day, renewed by staff when it lapses); the deposit (or the
  -- full payment) keeps using stripe_session_id / stripe_payment_intent_id / paid_at.
  add column balance_stripe_session_id text unique,
  add column balance_payment_intent_id text,
  add column balance_paid_at timestamptz,
  -- Which half was refunded in Stripe (refunded_at still marks a pass whose purchase must no longer be reported).
  add column deposit_refunded_at timestamptz,
  add column balance_refunded_at timestamptz;

alter table public.plan_passes add constraint plan_passes_payment_plan_check check (
  (payment_plan = 'visa' and deposit_amount is null and balance_amount is null)
  or (payment_plan = 'dalimis' and deposit_amount >= 0.5 and balance_amount >= 0.5 and deposit_amount + balance_amount = price)
);

alter table public.plan_passes drop constraint if exists plan_passes_status_check;
alter table public.plan_passes add constraint plan_passes_status_check
  check (status in ('laukia_apmokejimo', 'dalinai_apmoketa', 'apmoketa', 'priskirtas', 'atsauktas'));

-- A part-paid pass has no code yet (one that went back to part-paid after a balance refund keeps its old, inactive code).
alter table public.plan_passes drop constraint plan_passes_code_when_paid;
alter table public.plan_passes add constraint plan_passes_code_when_paid
  check (status in ('laukia_apmokejimo', 'dalinai_apmoketa', 'atsauktas') or code is not null);

create index plan_passes_balance_intent_idx on public.plan_passes (balance_payment_intent_id) where balance_payment_intent_id is not null;

-- ---------------------------------------------------------------------------
-- Buying: p_payment_plan 'visa' (default, as before) or 'dalimis'
-- ---------------------------------------------------------------------------

drop function public.create_plan_pass(uuid, text, text, boolean, text, text, text);

create function public.create_plan_pass(
  p_plan_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_gift boolean default false,
  p_recipient_name text default '',
  p_discount_code text default null,
  p_ip_hash text default null,
  p_payment_plan text default 'visa'
)
returns table (id uuid, reference text, plan_name text, price numeric, payment_plan text, deposit_amount numeric, balance_amount numeric)
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
  v_price numeric;
  v_mode text := coalesce(p_payment_plan, 'visa');
  v_deposit numeric;
  v_balance numeric;
begin
  if v_mode not in ('visa', 'dalimis') then
    raise exception 'Unknown payment plan' using errcode = '23514', hint = 'payment_plan_invalid';
  end if;

  select * into v_plan from public.ride_plans p
   where p.id = p_plan_id and p.active and p.sold_online and p.price is not null and p.price > 0;
  if not found then
    raise exception 'Plan is not sold online' using errcode = '23514', hint = 'plan_unavailable';
  end if;

  -- Only the WAKE season pass can be paid in two halves.
  if v_mode = 'dalimis' and v_plan.id <> '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid then
    raise exception 'This plan cannot be paid in parts' using errcode = '23514', hint = 'payment_plan_invalid';
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
  v_price := v_plan.price - v_discount;

  -- The split is of the final price: half now (rounded to the cent), the rest later. Both halves meet the 0.50 EUR minimum.
  if v_mode = 'dalimis' then
    v_deposit := round(v_price / 2, 2);
    v_balance := v_price - v_deposit;
    if v_deposit < 0.5 or v_balance < 0.5 then
      raise exception 'Part below the minimum' using errcode = '23514', hint = 'below_minimum';
    end if;
  end if;

  loop
    v_ref := 'PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.plan_passes s where s.reference = v_ref);
  end loop;
  insert into public.plan_passes (reference, plan_id, plan_name, plan_category, price, discount_code_id, discount_code, discount_amount,
                                  buyer_name, buyer_email, gift, recipient_name, ip_hash, payment_plan, deposit_amount, balance_amount)
  values (v_ref, v_plan.id, v_plan.name, v_plan.category, v_price, dc.code_id, dc.code, v_discount,
          btrim(p_buyer_name), lower(btrim(p_buyer_email)), coalesce(p_gift, false), btrim(coalesce(p_recipient_name, '')), p_ip_hash,
          v_mode, v_deposit, v_balance)
  returning plan_passes.id into v_id;
  return query select v_id, v_ref, v_plan.name, v_price, v_mode, v_deposit, v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- The balance link: staff open (or renew) a Checkout Session for the balance of a part-paid pass
-- ---------------------------------------------------------------------------

-- Remembers the balance session. `p_expected_session_id` is the session the caller saw (null when there was none), so two
-- staff members renewing an expired link at the same time cannot overwrite each other's session.
create function public.attach_plan_pass_balance_session(p_pass_id uuid, p_session_id text, p_expected_session_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.plan_passes p
     set balance_stripe_session_id = p_session_id
   where p.id = p_pass_id and p.status = 'dalinai_apmoketa' and p.payment_plan = 'dalimis'
     and p.balance_stripe_session_id is not distinct from p_expected_session_id;
  if not found then
    raise exception 'Pass is not waiting for its balance' using errcode = '23514', hint = 'pass_not_part_paid';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stripe webhook side (service role only)
-- ---------------------------------------------------------------------------

drop function public.complete_plan_pass_payment(uuid, text, text, numeric);

-- A paid session. p_balance = false: the first payment (the full price, or the deposit of a split pass); p_balance = true:
-- the balance of a split pass. The full price or the balance issues the code, once; the deposit only moves the pass to
-- `dalinai_apmoketa`. Safe to repeat (only the first call reports newly_paid). A paid amount that differs from what was due,
-- or a balance that arrives for a pass no longer waiting for it, changes nothing and reports amount_ok = false so staff can
-- check it (the payment is remembered, so a refund finds the pass).
create function public.complete_plan_pass_payment(
  p_pass_id uuid, p_session_id text, p_payment_intent text, p_amount numeric, p_balance boolean default false
)
returns table (
  newly_paid boolean, amount_ok boolean, order_status text, reference text, pass_code text,
  buyer_name text, buyer_email text, plan_name text, price numeric, gift boolean, recipient_name text,
  payment_plan text, deposit_amount numeric, balance_amount numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.plan_passes;
  v_code text;
  v_new boolean := false;
  v_ok boolean;
  v_due numeric;
begin
  select * into o from public.plan_passes x where x.id = p_pass_id for update;
  if not found then
    return;
  end if;

  if not coalesce(p_balance, false) then
    v_due := case when o.payment_plan = 'dalimis' then o.deposit_amount else o.price end;
    v_ok := p_amount = v_due;
    if o.status = 'laukia_apmokejimo' and v_ok and o.payment_plan = 'dalimis' then
      update public.plan_passes p
         set status = 'dalinai_apmoketa', paid_at = now(),
             stripe_session_id = coalesce(p_session_id, p.stripe_session_id), stripe_payment_intent_id = p_payment_intent
       where p.id = p_pass_id
      returning * into o;
      v_new := true;
    elsif o.status = 'laukia_apmokejimo' and v_ok then
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
    elsif o.status = 'laukia_apmokejimo' then
      update public.plan_passes p
         set stripe_payment_intent_id = coalesce(p_payment_intent, p.stripe_payment_intent_id)
       where p.id = p_pass_id
      returning * into o;
    end if;
  else
    if o.payment_plan = 'dalimis' and o.status = 'dalinai_apmoketa' and p_amount = o.balance_amount then
      -- A pass that went back to part-paid after a balance refund keeps its code; otherwise a new one.
      v_code := o.code;
      if v_code is null then
        loop
          v_code := private.generate_coupon_code();
          exit when not exists (select 1 from public.plan_passes s where s.code = v_code);
        end loop;
      end if;
      update public.plan_passes p
         set status = 'apmoketa', code = v_code, balance_paid_at = now(), balance_refunded_at = null,
             balance_stripe_session_id = coalesce(p_session_id, p.balance_stripe_session_id), balance_payment_intent_id = p_payment_intent
       where p.id = p_pass_id
      returning * into o;
      v_new := true;
      v_ok := true;
    elsif o.payment_plan = 'dalimis' and o.status in ('apmoketa', 'priskirtas') and o.balance_payment_intent_id is not distinct from p_payment_intent then
      -- Stripe repeated the event of the balance that was already recorded.
      v_ok := true;
    else
      v_ok := false;
      if o.payment_plan = 'dalimis' and o.balance_paid_at is null then
        update public.plan_passes p
           set balance_payment_intent_id = coalesce(p_payment_intent, p.balance_payment_intent_id)
         where p.id = p_pass_id
        returning * into o;
      end if;
    end if;
  end if;

  return query select v_new, v_ok, o.status, o.reference, o.code,
    o.buyer_name, o.buyer_email, o.plan_name, o.price, o.gift, o.recipient_name,
    o.payment_plan, o.deposit_amount, o.balance_amount;
end;
$$;

-- expire_plan_pass_session is unchanged: it matches stripe_session_id only, so an unpaid deposit (or full) session still
-- cancels its pass, and an expired balance session leaves the pass part-paid (staff send a new link).

drop function public.refund_plan_pass_payment(text, numeric);

-- A refund, matched to the first payment (stripe_payment_intent_id) or to the balance (balance_payment_intent_id).
--   Full payment (as before): a full refund cancels a pending or paid, unattached pass; an attached one is reported.
--   Split pass, deposit refunded: an unattached pass is cancelled (its code, if any, stops working); staff are told to
--     refund the balance too if it was paid. An attached one is reported.
--   Split pass, balance refunded: a paid, unattached pass goes back to `dalinai_apmoketa` (the deposit stays paid, the code
--     stops working until the balance is paid again). An attached one is reported. A balance that was never accepted (it
--     arrived for a cancelled pass or with a wrong amount) only records the refund.
-- outcome: 'atsauktas' (cancelled), 'priskirtas' (attached, change the rider's plan by hand), 'dalinai_apmoketa' (back to
-- part-paid) or 'grazinta' (refund recorded, nothing else changed).
create function public.refund_plan_pass_payment(p_payment_intent text, p_refunded numeric)
returns table (reference text, was_attached boolean, part text, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.plan_passes;
  v_part text;
  v_outcome text;
begin
  for o in
    select * from public.plan_passes p
     where p.stripe_payment_intent_id = p_payment_intent or p.balance_payment_intent_id = p_payment_intent
     for update
  loop
    v_part := case
      when o.payment_plan = 'visa' then 'visa'
      when o.stripe_payment_intent_id = p_payment_intent then 'depozitas'
      else 'likutis' end;

    if v_part = 'visa' then
      if o.status not in ('laukia_apmokejimo', 'apmoketa', 'priskirtas') or (o.status <> 'laukia_apmokejimo' and p_refunded < o.price) then
        continue;
      end if;
      v_outcome := case when o.status = 'priskirtas' then 'priskirtas' else 'atsauktas' end;
      update public.plan_passes p
         set status = case when p.status in ('laukia_apmokejimo', 'apmoketa') then 'atsauktas' else p.status end,
             refunded_at = coalesce(p.refunded_at, now())
       where p.id = o.id;
    elsif v_part = 'depozitas' then
      if o.status not in ('laukia_apmokejimo', 'dalinai_apmoketa', 'apmoketa', 'priskirtas')
         or (o.status <> 'laukia_apmokejimo' and p_refunded < o.deposit_amount) then
        continue;
      end if;
      v_outcome := case when o.status = 'priskirtas' then 'priskirtas' else 'atsauktas' end;
      update public.plan_passes p
         set status = case when p.status = 'priskirtas' then p.status else 'atsauktas' end,
             deposit_refunded_at = coalesce(p.deposit_refunded_at, now()),
             refunded_at = coalesce(p.refunded_at, now())
       where p.id = o.id;
    else
      if p_refunded < o.balance_amount then
        continue;
      end if;
      if o.status = 'apmoketa' and o.balance_paid_at is not null then
        v_outcome := 'dalinai_apmoketa';
        update public.plan_passes p
           set status = 'dalinai_apmoketa', balance_refunded_at = now(), balance_paid_at = null
         where p.id = o.id;
      elsif o.status = 'priskirtas' then
        v_outcome := 'priskirtas';
        update public.plan_passes p
           set balance_refunded_at = coalesce(p.balance_refunded_at, now()), refunded_at = coalesce(p.refunded_at, now())
         where p.id = o.id;
      else
        v_outcome := 'grazinta';
        update public.plan_passes p
           set balance_refunded_at = coalesce(p.balance_refunded_at, now())
         where p.id = o.id;
      end if;
    end if;

    reference := o.reference;
    was_attached := o.status = 'priskirtas';
    part := v_part;
    outcome := v_outcome;
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- What the payment return page shows: also the balance session, and what the split is
-- ---------------------------------------------------------------------------

drop function if exists public.plan_order_state(text);

create function public.plan_order_state(p_session_id text)
returns table (
  status text, reference text, plan_name text, price numeric, rider_email text, discount_code text, kind text, pass_code text, gift boolean,
  payment_plan text, deposit_amount numeric, balance_amount numeric, balance boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.status, o.reference, o.plan_name, o.price, coalesce(r.email, ''), o.discount_code, 'order'::text, null::text, false,
         'visa'::text, null::numeric, null::numeric, false
    from public.rider_plan_orders o join public.riders r on r.id = o.rider_id
   where o.stripe_session_id = p_session_id
  union all
  -- The first payment (full, or the deposit). An attached pass is still a paid pass to the buyer.
  select case when s.status = 'priskirtas' then 'apmoketa' else s.status end, s.reference, s.plan_name, s.price, s.buyer_email, s.discount_code, 'pass'::text,
         case when s.status in ('apmoketa', 'priskirtas') then s.code else null end, s.gift,
         s.payment_plan, s.deposit_amount, s.balance_amount, false
    from public.plan_passes s
   where s.stripe_session_id = p_session_id
  union all
  -- The balance: still part-paid means the webhook has not confirmed it yet.
  select case when s.status in ('apmoketa', 'priskirtas') then 'apmoketa' when s.status = 'dalinai_apmoketa' then 'laukia_apmokejimo' else s.status end,
         s.reference, s.plan_name, s.price, s.buyer_email, s.discount_code, 'pass'::text,
         case when s.status in ('apmoketa', 'priskirtas') then s.code else null end, s.gift,
         s.payment_plan, s.deposit_amount, s.balance_amount, true
    from public.plan_passes s
   where s.balance_stripe_session_id = p_session_id;
$$;

-- ---------------------------------------------------------------------------
-- Grants: service role only, like the other plan pass functions
-- ---------------------------------------------------------------------------

revoke execute on function public.create_plan_pass(uuid, text, text, boolean, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.attach_plan_pass_balance_session(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.complete_plan_pass_payment(uuid, text, text, numeric, boolean) from public, anon, authenticated;
revoke execute on function public.refund_plan_pass_payment(text, numeric) from public, anon, authenticated;
revoke execute on function public.plan_order_state(text) from public, anon, authenticated;
grant execute on function public.create_plan_pass(uuid, text, text, boolean, text, text, text, text) to service_role;
grant execute on function public.attach_plan_pass_balance_session(uuid, text, text) to service_role;
grant execute on function public.complete_plan_pass_payment(uuid, text, text, numeric, boolean) to service_role;
grant execute on function public.refund_plan_pass_payment(text, numeric) to service_role;
grant execute on function public.plan_order_state(text) to service_role;
