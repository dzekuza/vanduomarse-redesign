-- Coupon refunds, hardened (security review of 20261114160000). The refund is now reserved in the database before Stripe
-- is called, from values staff cannot edit:
--   * `coupon_refunds`: one row per coupon (unique), written only by service-role functions;
--   * the amount is recomputed from what Stripe actually charged (`coupons.paid_amount`, set by the webhook path) and the
--     redemption history, never from `balance` or `refunded_amount`;
--   * a trigger stops signed-in staff from editing the money columns of a coupon directly.

alter table public.coupons add column paid_amount numeric(10, 2) check (paid_amount is null or paid_amount >= 0);
-- Coupons already paid online: the webhook only issued a code when the paid amount equalled face value minus discount.
update public.coupons set paid_amount = face_value - discount_amount where stripe_payment_intent_id is not null;

-- The webhook records the amount Stripe reports as paid.
create or replace function public.complete_coupon_payment(p_coupon_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
returns table (
  newly_paid boolean, amount_ok boolean, status public.coupon_status, id uuid, reference text, code text, expires_at date,
  buyer_name text, buyer_email text, recipient_name text, recipient_email text, message text,
  product_name text, face_value numeric, service public.coupon_service
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.coupons;
  v_code text;
  v_expires date := ((now() at time zone 'Europe/Vilnius')::date + interval '12 months')::date;
  v_new boolean := false;
begin
  select * into c from public.coupons where coupons.id = p_coupon_id for update;
  if not found then
    return;
  end if;

  if c.status = 'laukia_apmokejimo' and p_amount = c.face_value - c.discount_amount then
    loop
      v_code := private.generate_coupon_code();
      exit when not exists (select 1 from public.coupons x where x.code = v_code);
    end loop;
    update public.coupons
       set code = v_code, status = 'aktyvus', paid_at = now(), expires_at = v_expires, paid_amount = p_amount,
           stripe_session_id = coalesce(p_session_id, stripe_session_id), stripe_payment_intent_id = p_payment_intent
     where coupons.id = p_coupon_id
    returning * into c;
    v_new := true;
  end if;

  return query select v_new, (p_amount = c.face_value - c.discount_amount), c.status, c.id, c.reference, c.code, c.expires_at,
    c.buyer_name, c.buyer_email, c.recipient_name, c.recipient_email, c.message, c.product_name, c.face_value, c.service;
end;
$$;

create table public.coupon_refunds (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null unique references public.coupons (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'done')),
  stripe_refund_id text,
  refunded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.coupon_refunds enable row level security;
revoke all on public.coupon_refunds from anon, authenticated;

-- Reserves the refund of a cancelled coupon that was paid online: what the buyer paid, scaled to the part not redeemed.
-- One row per coupon; a pending one is handed back (resumed) so a retry reuses the same Stripe key.
create function public.begin_coupon_refund(p_coupon uuid, p_staff uuid)
returns table (refund_id uuid, payment_intent text, amount numeric, reference text, resumed boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.coupons;
  r public.coupon_refunds;
  v_spent numeric;
  v_amount numeric;
begin
  select * into c from public.coupons where id = p_coupon for update;
  if not found then
    raise exception 'Unknown coupon' using errcode = 'P0002', hint = 'unknown';
  end if;
  if c.status <> 'atsauktas' then
    raise exception 'Coupon is not cancelled' using errcode = '23514', hint = 'not_cancelled';
  end if;
  if c.stripe_payment_intent_id is null or c.paid_amount is null then
    raise exception 'Not paid online' using errcode = '23514', hint = 'not_paid_online';
  end if;

  select * into r from public.coupon_refunds x where x.coupon_id = c.id;
  if found then
    if r.status = 'done' then
      raise exception 'Already refunded' using errcode = '23514', hint = 'already_refunded';
    end if;
    return query select r.id, c.stripe_payment_intent_id, r.amount, c.reference, true, r.created_at;
    return;
  end if;

  select coalesce(sum(x.amount), 0) into v_spent from public.coupon_redemptions x where x.coupon_id = c.id;
  v_amount := round(c.paid_amount * greatest(c.face_value - v_spent, 0) / c.face_value, 2);
  if v_amount < 0.01 then
    raise exception 'Nothing to refund' using errcode = '23514', hint = 'nothing_to_refund';
  end if;

  insert into public.coupon_refunds (coupon_id, amount, refunded_by) values (c.id, v_amount, p_staff) returning * into r;
  return query select r.id, c.stripe_payment_intent_id, r.amount, c.reference, false, r.created_at;
end;
$$;

create function public.finish_coupon_refund(p_id uuid, p_stripe_refund_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.coupon_refunds;
begin
  update public.coupon_refunds set status = 'done', stripe_refund_id = p_stripe_refund_id where id = p_id returning * into r;
  if found then
    update public.coupons set refunded_amount = r.amount, refunded_at = now() where id = r.coupon_id;
  end if;
end;
$$;

-- Stripe clearly refused: drop the reservation so the refund can be tried again.
create function public.fail_coupon_refund(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.coupon_refunds where id = p_id and status = 'pending';
$$;

revoke execute on function public.begin_coupon_refund(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.finish_coupon_refund(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_coupon_refund(uuid) from public, anon, authenticated;
grant execute on function public.begin_coupon_refund(uuid, uuid) to service_role;
grant execute on function public.finish_coupon_refund(uuid, text) to service_role;
grant execute on function public.fail_coupon_refund(uuid) to service_role;

-- Signed-in staff change a coupon's status (cancel) and redeem through their own rules, but never its money columns:
-- those are written by the payment webhook and the refund functions above, which run as the service role.
create function private.protect_coupon_money()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and (
       new.face_value is distinct from old.face_value
    or new.discount_amount is distinct from old.discount_amount
    or new.paid_amount is distinct from old.paid_amount
    or new.refunded_amount is distinct from old.refunded_amount
    or new.refunded_at is distinct from old.refunded_at
    or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
    or new.stripe_session_id is distinct from old.stripe_session_id
  ) then
    raise exception 'Coupon payment fields cannot be edited' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger coupons_protect_money before update on public.coupons
  for each row execute function private.protect_coupon_money();
