-- Gift coupons are paid online with Stripe Checkout and issued automatically by the webhook (ADR-0075).
-- Everything here is service-role only (the webhook and the checkout action); anon/authenticated cannot call it.
-- The staff "Pažymėti apmokėtu" path (activate_coupon) stays for orders paid by other means.

alter table public.coupons
  add column stripe_session_id text unique,
  add column stripe_payment_intent_id text;

create index coupons_stripe_intent_idx on public.coupons (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

-- Remember the Checkout Session of a still-unpaid order.
create function public.attach_coupon_session(p_coupon_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.coupons set stripe_session_id = p_session_id
   where id = p_coupon_id and status = 'laukia_apmokejimo';
  if not found then
    raise exception 'Coupon is not awaiting payment' using errcode = '23514', hint = 'coupon_not_pending';
  end if;
end;
$$;

-- The webhook calls this when Stripe says the session is paid. Issues the code once; safe to repeat
-- (only the first call reports newly_paid). A paid amount that differs from the coupon value issues nothing
-- and reports amount_ok = false so staff can check it.
create function public.complete_coupon_payment(p_coupon_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
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

  if c.status = 'laukia_apmokejimo' and p_amount = c.face_value then
    loop
      v_code := private.generate_coupon_code();
      exit when not exists (select 1 from public.coupons x where x.code = v_code);
    end loop;
    update public.coupons
       set code = v_code, status = 'aktyvus', paid_at = now(), expires_at = v_expires,
           stripe_session_id = coalesce(p_session_id, stripe_session_id), stripe_payment_intent_id = p_payment_intent
     where coupons.id = p_coupon_id
    returning * into c;
    v_new := true;
  end if;

  return query select v_new, (p_amount = c.face_value), c.status, c.id, c.reference, c.code, c.expires_at,
    c.buyer_name, c.buyer_email, c.recipient_name, c.recipient_email, c.message, c.product_name, c.face_value, c.service;
end;
$$;

-- The Checkout Session expired unpaid: the order is cancelled so it does not pile up as "pending".
create function public.expire_coupon_session(p_session_id text)
returns integer
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.coupons set status = 'atsauktas'
     where stripe_session_id = p_session_id and status = 'laukia_apmokejimo'
    returning 1
  )
  select count(*)::integer from u;
$$;

-- A full refund of an online coupon payment cancels the coupon (returns its reference, for the staff alert).
create function public.refund_coupon_payment(p_payment_intent text, p_refunded numeric)
returns text
language sql
security definer
set search_path = ''
as $$
  update public.coupons set status = 'atsauktas'
   where stripe_payment_intent_id = p_payment_intent and status in ('aktyvus') and p_refunded >= face_value
  returning reference;
$$;

-- What the return page shows; the Checkout Session id in the URL is unguessable.
create function public.coupon_payment_state(p_session_id text)
returns table (status public.coupon_status, reference text, product_name text, face_value numeric, has_recipient boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.status, c.reference, c.product_name, c.face_value, c.recipient_email <> ''
    from public.coupons c where c.stripe_session_id = p_session_id;
$$;

revoke execute on function public.attach_coupon_session(uuid, text) from public, anon, authenticated;
revoke execute on function public.complete_coupon_payment(uuid, text, text, numeric) from public, anon, authenticated;
revoke execute on function public.expire_coupon_session(text) from public, anon, authenticated;
revoke execute on function public.refund_coupon_payment(text, numeric) from public, anon, authenticated;
revoke execute on function public.coupon_payment_state(text) from public, anon, authenticated;
grant execute on function public.attach_coupon_session(uuid, text) to service_role;
grant execute on function public.complete_coupon_payment(uuid, text, text, numeric) to service_role;
grant execute on function public.expire_coupon_session(text) to service_role;
grant execute on function public.refund_coupon_payment(text, numeric) to service_role;
grant execute on function public.coupon_payment_state(text) to service_role;
