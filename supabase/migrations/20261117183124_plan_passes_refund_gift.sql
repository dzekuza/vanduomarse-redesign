-- Review follow-up to 20261117180903_plan_passes.sql (ADR-0109):
-- 1. A payment whose amount differs from the pass price issues no code, but the Stripe payment is now remembered on the pending
--    pass, so a refund in Stripe (which staff are told to do) finds and cancels it instead of leaving it pending.
-- 2. plan_order_state also says whether a pass is a gift, so the payment page can address the buyer correctly.

create or replace function public.complete_plan_pass_payment(p_pass_id uuid, p_session_id text, p_payment_intent text, p_amount numeric)
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
  elsif o.status = 'laukia_apmokejimo' then
    update public.plan_passes p
       set stripe_payment_intent_id = coalesce(p_payment_intent, p.stripe_payment_intent_id)
     where p.id = p_pass_id
    returning * into o;
  end if;

  return query select v_new, (p_amount = o.price), o.status, o.reference, o.code,
    o.buyer_name, o.buyer_email, o.plan_name, o.price, o.gift, o.recipient_name;
end;
$$;

-- A refund cancels a pass that was paid but not attached, and a pending pass whose payment did not match the price (it has a
-- payment intent only because money arrived). An attached pass is left as it is and reported.
create or replace function public.refund_plan_pass_payment(p_payment_intent text, p_refunded numeric)
returns table (reference text, was_attached boolean)
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.plan_passes p
       set status = case when p.status in ('laukia_apmokejimo', 'apmoketa') then 'atsauktas' else p.status end
     where p.stripe_payment_intent_id = p_payment_intent
       and p.status in ('laukia_apmokejimo', 'apmoketa', 'priskirtas')
       and (p.status = 'laukia_apmokejimo' or p_refunded >= p.price)
    returning p.reference, (p.status = 'priskirtas') as was_attached
  )
  select u.reference, u.was_attached from u;
$$;

drop function if exists public.plan_order_state(text);

create function public.plan_order_state(p_session_id text)
returns table (status text, reference text, plan_name text, price numeric, rider_email text, discount_code text, kind text, pass_code text, gift boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select o.status, o.reference, o.plan_name, o.price, coalesce(r.email, ''), o.discount_code, 'order'::text, null::text, false
    from public.rider_plan_orders o join public.riders r on r.id = o.rider_id
   where o.stripe_session_id = p_session_id
  union all
  select case when s.status = 'priskirtas' then 'apmoketa' else s.status end, s.reference, s.plan_name, s.price, s.buyer_email, s.discount_code, 'pass'::text,
         case when s.status in ('apmoketa', 'priskirtas') then s.code else null end, s.gift
    from public.plan_passes s
   where s.stripe_session_id = p_session_id;
$$;

revoke execute on function public.plan_order_state(text) from public, anon, authenticated;
grant execute on function public.plan_order_state(text) to service_role;
