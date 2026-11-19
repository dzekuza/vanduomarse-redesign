-- Points / kreditai, phase 2 (ADR-0122): spending points as a discount on a reservation payment.
--
-- The customer ticks "use points" at checkout. After start_payment has grouped the requests, redeem_points_on_payment turns
-- points into euros off the payment: payments.amount (the cash Stripe charges) goes down, the requests keep their gross totals,
-- and the Checkout Session carries the difference as a one-off discount. The client only ever sends "use points"; the euro
-- amount is computed here from the live setting, the balance and the 0.50 EUR minimum charge.
--
--  - payments.points_spent / points_discount / points_rider_id record what was used and by whom.
--  - Points are held while the payment waits, and given back if it expires or fails (trigger below).
--  - A payment that is paid late, after its points were given back, takes them again; if they are gone it is flagged for review.
--  - Refunds: begin_request_refund refunds only the cash share of a request, and spent points come back pro rata with the cash.

alter table public.payments
  add column points_spent integer not null default 0 check (points_spent >= 0),
  add column points_discount numeric(10, 2) not null default 0 check (points_discount >= 0),
  add column points_rider_id uuid references public.riders (id) on delete set null;

comment on column public.payments.points_discount is
  'Euros the customer paid with points. payments.amount is the cash charge after it; the requests keep their gross totals.';

-- ---------------------------------------------------------------------------
-- Which customer record an account spends from
-- ---------------------------------------------------------------------------

-- The rider this account may spend points of: matched by a confirmed e-mail or the main phone (the primary match of my_riders,
-- never a second phone), not waiting for review. With several, the one holding the most points, then the oldest.
create function private.rider_for_user(p_user uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
    from public.riders r
    join auth.users u on u.id = p_user
   where not r.needs_review
     and (
       (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
       or (u.phone_confirmed_at is not null
           and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 9
           and regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') = private.normalize_phone(r.phone))
     )
   order by r.points_balance desc, r.created_at
   limit 1;
$$;
revoke execute on function private.rider_for_user(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Redeem
-- ---------------------------------------------------------------------------

-- Uses up to p_points of the account's points on an open payment of theirs. Safe to repeat (a payment redeems once). Returns what
-- was used; points_spent 0 means nothing changed (no points, setting off, payment not open, or nothing to discount).
create function public.redeem_points_on_payment(p_payment_id uuid, p_user uuid, p_points integer)
returns table (points_spent integer, points_discount numeric, amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.loyalty_settings;
  p public.payments;
  v_rider uuid;
  v_balance integer;
  v_max integer;
  v_points integer;
  v_discount numeric;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.user_id is distinct from p_user or p.status <> 'laukia' or p.points_spent > 0 then
    return query select coalesce(p.points_spent, 0), coalesce(p.points_discount, 0), coalesce(p.amount, 0::numeric);
    return;
  end if;
  select * into s from public.loyalty_settings where id;
  v_rider := private.rider_for_user(p_user);
  if not s.enabled or v_rider is null or p_points is null or p_points <= 0 then
    return query select 0, 0::numeric, p.amount;
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext('points:' || v_rider::text));
  select points_balance into v_balance from public.riders where id = v_rider;
  -- The cash charge must stay at least 0.50 EUR (Stripe's minimum).
  v_max := floor((p.amount - 0.50) / s.point_value_eur);
  v_points := least(p_points, v_balance, greatest(v_max, 0));
  if v_points <= 0 then
    return query select 0, 0::numeric, p.amount;
    return;
  end if;
  v_discount := round(v_points * s.point_value_eur, 2);
  if v_discount <= 0 or p.amount - v_discount < 0.50 then
    return query select 0, 0::numeric, p.amount;
    return;
  end if;

  perform private.apply_points(v_rider, -v_points, 'redeem', 'Atsiskaitymas', 'payment_redeem', p.id, null);
  update public.payments
     set points_spent = v_points, points_discount = v_discount, points_rider_id = v_rider, amount = p.amount - v_discount
   where id = p.id
   returning * into p;
  return query select p.points_spent, p.points_discount, p.amount;
end;
$$;
revoke execute on function public.redeem_points_on_payment(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.redeem_points_on_payment(uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Give back, take again, return on refund
-- ---------------------------------------------------------------------------

-- A waiting payment that expired or failed gives its points back; one that is paid after that takes them again (and is flagged
-- for review when the customer has spent them elsewhere meanwhile).
create function private.payment_points_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.points_spent <= 0 or new.points_rider_id is null then
    return new;
  end if;
  if old.status = 'laukia' and new.status in ('pasibaige', 'nepavyko') then
    perform private.apply_points(new.points_rider_id, new.points_spent, 'release', 'Mokėjimas neįvyko', 'payment_redeem', new.id, null);
  elsif old.status in ('pasibaige', 'nepavyko') and new.status = 'apmoketa' then
    begin
      perform private.apply_points(new.points_rider_id, -new.points_spent, 'redeem', 'Vėlai apmokėtas mokėjimas', 'payment_retake', new.id, null);
    exception when others then
      new.needs_review := true;
    end;
  end if;
  return new;
end;
$$;
revoke execute on function private.payment_points_lifecycle() from public, anon, authenticated;

create trigger payments_points_lifecycle
  before update of status on public.payments
  for each row
  when (old.status is distinct from new.status)
  execute function private.payment_points_lifecycle();

-- Cash refunded: the matching share of the spent points comes back (cumulative, so partial refunds add up and a repeat changes nothing).
create function private.return_spent_points_on_refund()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_due integer;
  v_given integer;
  v_give integer;
  v_balance integer;
begin
  if new.points_spent <= 0 or new.points_rider_id is null or new.amount <= 0 then
    return new;
  end if;
  v_due := case when new.status = 'grazinta' then new.points_spent else floor(new.points_spent * least(new.refunded / new.amount, 1)) end;
  perform pg_advisory_xact_lock(hashtext('points:' || new.points_rider_id::text));
  select coalesce(sum(l.delta), 0) into v_given
    from public.points_ledger l
   where l.kind = 'return' and l.source_kind = 'payment_refund_return' and l.parent_source_id = new.id;
  v_give := v_due - v_given;
  if v_give > 0 then
    select points_balance into v_balance from public.riders where id = new.points_rider_id;
    insert into public.points_ledger (rider_id, delta, kind, reason, source_kind, source_id, parent_source_id, balance_after)
    values (new.points_rider_id, v_give, 'return', 'Grąžinti panaudoti taškai', 'payment_refund_return',
            md5(new.id::text || ':return:' || ((select count(*) from public.points_ledger x where x.parent_source_id = new.id and x.kind = 'return') + 1)::text)::uuid,
            new.id, v_balance + v_give)
    on conflict do nothing;
    if found then
      perform set_config('app.points_write', 'on', true);
      update public.riders set points_balance = v_balance + v_give where id = new.points_rider_id;
      perform set_config('app.points_write', 'off', true);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.return_spent_points_on_refund() from public, anon, authenticated;

create trigger payments_return_spent_points
  after update of refunded, status on public.payments
  for each row
  when (new.refunded is distinct from old.refunded or (new.status = 'grazinta' and old.status is distinct from 'grazinta'))
  execute function private.return_spent_points_on_refund();

-- ---------------------------------------------------------------------------
-- A request refunds only its cash share
-- ---------------------------------------------------------------------------

-- Same as the version from 20261112165835, except the cap: with points used, a request paid part in cash and part in points, so it
-- gets back its share of the cash (total x cash / (cash + points)), never more than the cash still left on the payment.
create or replace function public.begin_request_refund(p_kind text, p_id uuid, p_staff uuid)
returns table (refund_id uuid, reference text, payment_intent text, amount numeric, resumed boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid;
  v_total numeric;
  v_ref text;
  p public.payments;
  r public.request_refunds;
  v_taken numeric;
  v_share numeric;
  v_cap numeric;
begin
  if p_kind = 'booking' then
    select b.payment_id, b.total, b.reference into v_pid, v_total, v_ref from public.bookings b where b.id = p_id;
  elsif p_kind = 'rental' then
    select q.payment_id, q.total, q.reference into v_pid, v_total, v_ref from public.quad_rentals q where q.id = p_id;
  elsif p_kind = 'ticket' then
    select t.payment_id, t.total, t.reference into v_pid, v_total, v_ref from public.event_tickets t where t.id = p_id;
  else
    raise exception 'Unknown request kind' using errcode = '23514', hint = 'not_paid_online';
  end if;
  if not found or v_pid is null then
    raise exception 'Request was not paid online' using errcode = '23514', hint = 'not_paid_online';
  end if;

  select * into p from public.payments x where x.id = v_pid for update;

  select * into r from public.request_refunds x where x.kind = p_kind and x.request_id = p_id;
  if found then
    if r.status = 'done' then
      raise exception 'Request already refunded' using errcode = '23514', hint = 'already_refunded';
    end if;
    return query select r.id, r.reference, p.stripe_payment_intent_id, r.amount, true, r.created_at;
    return;
  end if;

  if p.status <> 'apmoketa' or p.stripe_payment_intent_id is null then
    raise exception 'Payment is not paid' using errcode = '23514', hint = 'not_paid';
  end if;

  select coalesce(sum(x.amount), 0) into v_taken from public.request_refunds x where x.payment_id = v_pid;
  v_share := case when p.points_discount > 0 then round(v_total * p.amount / (p.amount + p.points_discount), 2) else v_total end;
  v_cap := least(v_share, p.amount - greatest(p.refunded, v_taken));
  if v_cap <= 0 then
    raise exception 'Nothing left to refund' using errcode = '23514', hint = 'nothing_to_refund';
  end if;

  insert into public.request_refunds (payment_id, kind, request_id, reference, amount, refunded_by)
  values (v_pid, p_kind, p_id, v_ref, v_cap, p_staff)
  returning * into r;

  return query select r.id, r.reference, p.stripe_payment_intent_id, r.amount, false, r.created_at;
end;
$$;
revoke execute on function public.begin_request_refund(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_request_refund(text, uuid, uuid) to service_role;
