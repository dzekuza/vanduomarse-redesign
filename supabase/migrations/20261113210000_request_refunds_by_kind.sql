-- Hardens the refund reservation (ADR-0081) after a security review and Stripe's idempotency / error guidance.
--
-- 1. A request is found by its kind and row id, not by a reference searched across three tables: refunds are keyed by
--    (kind, request_id), so a reference collision between tables can never refund the wrong request.
-- 2. A pending reservation is never silently dropped. If the action died, or Stripe's answer was lost, the pending row is
--    handed back (`resumed`) with its stored amount, and the server reconciles it against Stripe before doing anything.
--    Only an explicit `fail_request_refund` (Stripe clearly refused) removes it.
-- request_refunds is still empty, so the new NOT NULL columns need no backfill.

alter table public.request_refunds
  add column kind text not null check (kind in ('booking', 'rental', 'ticket')),
  add column request_id uuid not null;
alter table public.request_refunds drop constraint request_refunds_reference_key;
alter table public.request_refunds add constraint request_refunds_request_key unique (kind, request_id);

drop function public.begin_request_refund(text, uuid);

create function public.begin_request_refund(p_kind text, p_id uuid, p_staff uuid)
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

  -- An earlier attempt: done means refunded; pending means unknown, to be reconciled with Stripe by the caller.
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
  v_cap := least(v_total, p.amount - greatest(p.refunded, v_taken));
  if v_cap <= 0 then
    raise exception 'Nothing left to refund' using errcode = '23514', hint = 'nothing_to_refund';
  end if;

  insert into public.request_refunds (payment_id, kind, request_id, reference, amount, refunded_by)
  values (v_pid, p_kind, p_id, v_ref, v_cap, p_staff)
  returning * into r;

  return query select r.id, r.reference, p.stripe_payment_intent_id, r.amount, false, r.created_at;
end;
$$;

-- Stripe has the refund (any state but failed / canceled).
create or replace function public.finish_request_refund(p_id uuid, p_stripe_refund_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.request_refunds set status = 'done', stripe_refund_id = p_stripe_refund_id where id = p_id and status = 'pending';
$$;

revoke execute on function public.begin_request_refund(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_request_refund(text, uuid, uuid) to service_role;
