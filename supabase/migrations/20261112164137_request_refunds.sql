-- Staff can cancel a paid request and refund exactly what that request paid (ADR-0081).
-- One online payment can cover several requests (a bookings / quad_rentals / event_tickets row each has its own `total`),
-- so a refund is tracked per request: `request_refunds` has one row per request reference, which makes a second refund
-- of the same request impossible. Service-role only: the admin action calls the three functions below, then Stripe.

create table public.request_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  reference text not null unique,
  amount numeric(10, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'done')),
  stripe_refund_id text,
  refunded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index request_refunds_payment_idx on public.request_refunds (payment_id);

alter table public.request_refunds enable row level security;
revoke all on public.request_refunds from anon, authenticated;

-- Reserves the refund of one request: what it paid, capped by what is still unrefunded on the payment (also counting
-- refunds made by hand in Stripe, which the webhook records in payments.refunded). A pending row older than two minutes
-- (the action died before reaching Stripe) is dropped so the refund can be retried.
create function public.begin_request_refund(p_reference text, p_staff uuid)
returns table (refund_id uuid, payment_intent text, amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid;
  v_total numeric;
  p public.payments;
  v_taken numeric;
  v_cap numeric;
  v_id uuid;
begin
  select b.payment_id, b.total into v_pid, v_total from public.bookings b where b.reference = p_reference;
  if not found then
    select q.payment_id, q.total into v_pid, v_total from public.quad_rentals q where q.reference = p_reference;
  end if;
  if not found then
    select t.payment_id, t.total into v_pid, v_total from public.event_tickets t where t.reference = p_reference;
  end if;
  if not found or v_pid is null then
    raise exception 'Request was not paid online' using errcode = '23514', hint = 'not_paid_online';
  end if;

  select * into p from public.payments x where x.id = v_pid for update;
  if p.status <> 'apmoketa' or p.stripe_payment_intent_id is null then
    raise exception 'Payment is not paid' using errcode = '23514', hint = 'not_paid';
  end if;

  delete from public.request_refunds r
   where r.reference = p_reference and r.status = 'pending' and r.created_at < now() - interval '2 minutes';
  if exists (select 1 from public.request_refunds r where r.reference = p_reference) then
    raise exception 'Request already refunded' using errcode = '23514', hint = 'already_refunded';
  end if;

  select coalesce(sum(r.amount), 0) into v_taken from public.request_refunds r where r.payment_id = v_pid;
  v_cap := least(v_total, p.amount - greatest(p.refunded, v_taken));
  if v_cap <= 0 then
    raise exception 'Nothing left to refund' using errcode = '23514', hint = 'nothing_to_refund';
  end if;

  insert into public.request_refunds (payment_id, reference, amount, refunded_by)
  values (v_pid, p_reference, v_cap, p_staff)
  returning request_refunds.id into v_id;

  return query select v_id, p.stripe_payment_intent_id, v_cap;
end;
$$;

-- Stripe accepted the refund.
create function public.finish_request_refund(p_id uuid, p_stripe_refund_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.request_refunds set status = 'done', stripe_refund_id = p_stripe_refund_id where id = p_id;
$$;

-- Stripe refused it: drop the reservation so staff can try again.
create function public.fail_request_refund(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.request_refunds where id = p_id and status = 'pending';
$$;

revoke execute on function public.begin_request_refund(text, uuid) from public, anon, authenticated;
revoke execute on function public.finish_request_refund(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_request_refund(uuid) from public, anon, authenticated;
grant execute on function public.begin_request_refund(text, uuid) to service_role;
grant execute on function public.finish_request_refund(uuid, text) to service_role;
grant execute on function public.fail_request_refund(uuid) to service_role;
