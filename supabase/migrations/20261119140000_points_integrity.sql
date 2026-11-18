-- Points integrity (ADR-0121, security review of PR #147):
--  1. riders.points_balance may only change through private.apply_points. Staff with the klientai / apyrankes permission can
--     already update riders rows, so without a guard they could edit the balance directly and skip the ledger.
--  2. Points earned by a payment or plan order are taken back when it is refunded (pro rata for partial refunds), capped at
--     what the customer still holds, so a refund no longer leaves the points behind.

-- ---------------------------------------------------------------------------
-- 1. Guard the balance column
-- ---------------------------------------------------------------------------

create function private.guard_points_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.points_write', true), '') = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' and new.points_balance <> 0 then
    raise exception 'Points change only through the points ledger' using errcode = '42501', hint = 'points_direct_write';
  end if;
  if tg_op = 'UPDATE' and new.points_balance is distinct from old.points_balance then
    raise exception 'Points change only through the points ledger' using errcode = '42501', hint = 'points_direct_write';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_points_balance() from public, anon, authenticated;

create trigger riders_guard_points_balance
  before insert or update of points_balance on public.riders
  for each row execute function private.guard_points_balance();

-- apply_points opens the guard for its own write only (transaction-local setting).
create or replace function private.apply_points(
  p_rider uuid, p_delta integer, p_kind text, p_reason text,
  p_source_kind text default null, p_source_id uuid default null, p_by uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_new integer;
  v_inserted integer;
begin
  if p_delta = 0 then
    raise exception 'Zero points' using errcode = '22023', hint = 'points_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtext('points:' || p_rider::text));

  select points_balance into v_balance from public.riders where id = p_rider for update;
  if not found then
    raise exception 'Unknown customer' using errcode = '23503', hint = 'points_no_rider';
  end if;
  v_new := v_balance + p_delta;
  if v_new < 0 then
    raise exception 'Not enough points' using errcode = '23514', hint = 'points_insufficient';
  end if;

  insert into public.points_ledger (rider_id, delta, kind, reason, source_kind, source_id, created_by, balance_after)
  values (p_rider, p_delta, p_kind, coalesce(p_reason, ''), p_source_kind, p_source_id, p_by, v_new)
  on conflict (source_kind, source_id, kind) where source_id is not null do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return v_balance;
  end if;

  perform set_config('app.points_write', 'on', true);
  update public.riders set points_balance = v_new where id = p_rider;
  perform set_config('app.points_write', 'off', true);
  return v_new;
end;
$$;
revoke execute on function private.apply_points(uuid, integer, text, text, text, uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Take points back on a refund
-- ---------------------------------------------------------------------------

-- A clawback row points at the payment it belongs to, so several partial-refund steps can be summed.
alter table public.points_ledger add column parent_source_id uuid;
create index points_ledger_parent_idx on public.points_ledger (parent_source_id) where parent_source_id is not null;

-- A payment's refunded amount grew (or it became fully refunded): take back the share of its earned points that belongs to the
-- refunded part. The total taken so far is read from the ledger, so repeated partial refunds add up and a repeat changes nothing.
-- Capped at the current balance: points the customer has already spent are not chased.
create function private.claw_back_payment_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rider uuid;
  v_earned integer;
  v_kept integer;
  v_taken integer;
  v_balance integer;
  v_take integer;
begin
  select e.rider_id, e.delta into v_rider, v_earned
    from public.points_ledger e
   where e.source_kind = 'payment' and e.source_id = new.id and e.kind = 'earn';
  if not found or new.amount <= 0 then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('points:' || v_rider::text));

  v_kept := floor(v_earned * greatest(new.amount - coalesce(new.refunded, 0), 0) / new.amount);
  if new.status = 'grazinta' then
    v_kept := 0;
  end if;
  select coalesce(-sum(c.delta), 0) into v_taken
    from public.points_ledger c
   where c.rider_id = v_rider and c.kind = 'clawback' and c.source_kind = 'payment_refund' and c.parent_source_id = new.id;
  select points_balance into v_balance from public.riders where id = v_rider;
  v_take := least((v_earned - v_kept) - v_taken, v_balance);
  if v_take > 0 then
    -- One clawback row per refund step; its own key (payment id + step number) keeps the unique index from blocking a later step.
    insert into public.points_ledger (rider_id, delta, kind, reason, source_kind, source_id, parent_source_id, balance_after)
    values (v_rider, -v_take, 'clawback', 'Pinigų grąžinimas', 'payment_refund',
            md5(new.id::text || ':' || ((select count(*) from public.points_ledger x where x.parent_source_id = new.id) + 1)::text)::uuid,
            new.id, v_balance - v_take)
    on conflict do nothing;
    if found then
      perform set_config('app.points_write', 'on', true);
      update public.riders set points_balance = v_balance - v_take where id = v_rider;
      perform set_config('app.points_write', 'off', true);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.claw_back_payment_points() from public, anon, authenticated;

create trigger payments_claw_back_points
  after update of refunded, status on public.payments
  for each row
  when (new.refunded is distinct from old.refunded or (new.status = 'grazinta' and old.status is distinct from 'grazinta'))
  execute function private.claw_back_payment_points();

-- A plan order cancelled by a full refund: take its points back (what the customer still holds).
create function private.claw_back_plan_order_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rider uuid;
  v_earned integer;
  v_balance integer;
  v_take integer;
begin
  select e.rider_id, e.delta into v_rider, v_earned
    from public.points_ledger e
   where e.source_kind = 'plan_order' and e.source_id = new.id and e.kind = 'earn';
  if not found then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('points:' || v_rider::text));
  select points_balance into v_balance from public.riders where id = v_rider;
  v_take := least(v_earned, v_balance);
  if v_take > 0 then
    insert into public.points_ledger (rider_id, delta, kind, reason, source_kind, source_id, balance_after)
    values (v_rider, -v_take, 'clawback', 'Pinigų grąžinimas', 'plan_order', new.id, v_balance - v_take)
    on conflict do nothing;
    if found then
      perform set_config('app.points_write', 'on', true);
      update public.riders set points_balance = v_balance - v_take where id = v_rider;
      perform set_config('app.points_write', 'off', true);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.claw_back_plan_order_points() from public, anon, authenticated;

create trigger rider_plan_orders_claw_back_points
  after update of status on public.rider_plan_orders
  for each row
  when (old.status = 'apmoketa' and new.status = 'atsauktas')
  execute function private.claw_back_plan_order_points();
