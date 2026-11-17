-- Payment of staff-entered reservations (/admin, "Nauja rezervacija").
--
-- Staff record how a phone or walk-in booking was paid. Paid at the till: `paid_at` and `payment_method` (grynais or
-- kortele) are set on the booking or ticket itself. Not paid: the server opens a Stripe Checkout payment for it
-- (`start_staff_payment`, like the website's `start_payment` but without a customer account) and e-mails the link.
-- The Stripe webhook then completes it through the existing `complete_payment`.

alter table public.bookings
  add column payment_method text check (payment_method in ('kortele', 'grynais')),
  add column paid_at timestamptz;

alter table public.event_tickets
  add column payment_method text check (payment_method in ('kortele', 'grynais')),
  add column paid_at timestamptz;

comment on column public.bookings.paid_at is 'Set when staff record the booking as paid at entry (cash or card). Online payments are tracked by payment_id.';
comment on column public.event_tickets.paid_at is 'Set when staff record the ticket as paid at entry (cash or card). Online payments are tracked by payment_id.';

-- A payment started by staff has no customer account; the webhook may e-mail the address staff typed for it.
alter table public.payments add column staff_created boolean not null default false;

create or replace function public.payment_notify_email(p_payment_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when p.user_id is not null then public.account_notify_email(p.user_id)
           when p.staff_created then nullif(btrim(coalesce(p.customer_email, '')), '')
         end
    from public.payments p
   where p.id = p_payment_id;
$$;

-- Groups the unpaid staff-entered requests (phone / on site) into one payment. Staff authorisation is checked by the
-- server action before it calls this (service role only). Every reference must be a staff booking or ticket that is
-- not cancelled, not paid and not in a payment yet; the amount is the sum of the stored totals.
create function public.start_staff_payment(p_refs text[])
returns table (payment_id uuid, amount numeric, expires_at timestamptz, stripe_session_id text, customer_email text, items jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refs text[];
  v_items jsonb;
  v_count integer;
  v_amount numeric;
  v_email text;
  v_phone text;
  p public.payments;
begin
  select array_agg(distinct r) into v_refs from unnest(p_refs) r where r is not null and btrim(r) <> '';
  if v_refs is null or array_length(v_refs, 1) > 10 then
    raise exception 'Invalid request list' using errcode = '23514', hint = 'payment_requests';
  end if;

  with req as (
    select 'bookings'::text as tbl, b.id, b.reference, b.total, b.customer_email as email, b.customer_phone as phone
      from public.bookings b
     where b.reference = any (v_refs) and b.source in ('telefonu', 'vietoje') and b.status <> 'atsaukta'
       and b.payment_id is null and b.paid_at is null
    union all
    select 'event_tickets', t.id, t.reference, t.total, t.customer_email, t.customer_phone
      from public.event_tickets t
     where t.reference = any (v_refs) and t.source in ('telefonu', 'vietoje') and t.status <> 'atsaukta'
       and t.payment_id is null and t.paid_at is null
  )
  select jsonb_agg(jsonb_build_object('tbl', f.tbl, 'id', f.id)), count(*), coalesce(sum(f.total), 0),
         min(f.email) filter (where btrim(coalesce(f.email, '')) <> ''),
         min(f.phone) filter (where btrim(coalesce(f.phone, '')) <> '')
    into v_items, v_count, v_amount, v_email, v_phone
    from req f;

  if v_count is distinct from array_length(v_refs, 1) then
    raise exception 'Requests not found or already paid' using errcode = '23514', hint = 'payment_requests';
  end if;
  if v_amount <= 0 then
    raise exception 'Nothing to pay' using errcode = '23514', hint = 'payment_free';
  end if;

  insert into public.payments (user_id, amount, customer_phone, customer_email, staff_created)
  values (null, v_amount, v_phone, v_email, true)
  returning * into p;

  update public.bookings set payment_id = p.id
   where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'bookings');
  update public.event_tickets set payment_id = p.id
   where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'event_tickets');

  return query
    select p.id, p.amount, p.expires_at, p.stripe_session_id, p.customer_email, private.payment_items(p.id);
end;
$$;

revoke execute on function public.start_staff_payment(text[]) from public, anon, authenticated;
grant execute on function public.start_staff_payment(text[]) to service_role;
