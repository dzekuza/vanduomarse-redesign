-- One open Checkout Session per payment, and no lost payments (ADR-0026, security review).
--
-- 1. attach_payment_session only replaces the session it expects, so two concurrent "pay again"
--    clicks cannot both attach a new session (the loser's session is expired by the server).
-- 2. complete_payment can find the payment by its id (the Checkout Session carries it in metadata)
--    when the paying session is no longer the current one, and records that session as the paid
--    one. A second, different payment intent on an already-paid payment is a double charge: it is
--    reported (`duplicate`) and flagged for review so staff refund it.

-- ---------------------------------------------------------------------------
-- 1. Conditional attach
-- ---------------------------------------------------------------------------

drop function public.attach_payment_session(uuid, text, timestamptz);

create function public.attach_payment_session(p_payment_id uuid, p_session_id text, p_expires_at timestamptz, p_expected_session_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments
     set stripe_session_id = p_session_id, expires_at = p_expires_at
   where id = p_payment_id and status = 'laukia'
     and stripe_session_id is not distinct from p_expected_session_id;
  if not found then
    raise exception 'Payment is not open or already has a newer session' using errcode = '23514', hint = 'payment_exists';
  end if;
end;
$$;

revoke execute on function public.attach_payment_session(uuid, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.attach_payment_session(uuid, text, timestamptz, text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Complete by session or by payment id, and spot double charges
-- ---------------------------------------------------------------------------

drop function public.complete_payment(text, text, numeric);

create function public.complete_payment(p_session_id text, p_payment_intent text, p_amount numeric, p_payment_id uuid default null)
returns table (newly_paid boolean, payment_id uuid, phone text, amount numeric, refs text[], needs_review boolean, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  v_review boolean := false;
  v_dup boolean := false;
begin
  select * into p from public.payments where stripe_session_id = p_session_id for update;
  if not found and p_payment_id is not null then
    -- Paid through a session that is no longer the current one: the id travels in its metadata.
    select * into p from public.payments where id = p_payment_id for update;
  end if;
  if not found then
    return;
  end if;

  if p.status in ('apmoketa', 'grazinta') then
    -- Stripe retries events; only a different payment intent is a second charge.
    v_dup := coalesce(nullif(p_payment_intent, ''), '') <> ''
             and p.stripe_payment_intent_id is not null
             and p.stripe_payment_intent_id <> p_payment_intent;
    if v_dup and not p.needs_review then
      update public.payments pm set needs_review = true where pm.id = p.id returning * into p;
    end if;
    return query select false, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review, v_dup;
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
     set status = 'apmoketa', paid_at = now(),
         stripe_session_id = p_session_id,
         stripe_payment_intent_id = coalesce(nullif(p_payment_intent, ''), pm.stripe_payment_intent_id),
         needs_review = pm.needs_review or v_review
   where pm.id = p.id
   returning * into p;

  return query select true, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review, false;
end;
$$;

revoke execute on function public.complete_payment(text, text, numeric, uuid) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, numeric, uuid) to service_role;
