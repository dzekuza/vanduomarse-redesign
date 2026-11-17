-- Review follow-up (ADR-0109): a full refund of a pass that staff already attached leaves it `priskirtas` (the rider keeps the
-- plan until staff change it), so the status alone cannot tell a refunded pass from a paid one. `refunded_at` marks any refunded
-- pass, and the Meta / GA purchase check refuses a refunded one.
alter table public.plan_passes add column refunded_at timestamptz;

create or replace function public.refund_plan_pass_payment(p_payment_intent text, p_refunded numeric)
returns table (reference text, was_attached boolean)
language sql
security definer
set search_path = ''
as $$
  with u as (
    update public.plan_passes p
       set status = case when p.status in ('laukia_apmokejimo', 'apmoketa') then 'atsauktas' else p.status end,
           refunded_at = coalesce(p.refunded_at, now())
     where p.stripe_payment_intent_id = p_payment_intent
       and p.status in ('laukia_apmokejimo', 'apmoketa', 'priskirtas')
       and (p.status = 'laukia_apmokejimo' or p_refunded >= p.price)
    returning p.reference, (p.status = 'priskirtas') as was_attached
  )
  select u.reference, u.was_attached from u;
$$;
