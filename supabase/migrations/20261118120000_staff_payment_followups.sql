-- Follow-ups of the staff payments (ADR-0112, ADR-0113): quad rentals and tours get the same paid-at-entry columns, and
-- `start_staff_payment` can be called again for the same request ("send the link again", "copy the link"): it returns the
-- request's open staff payment, or starts a new one when the earlier one expired. `void_staff_payment` retires an unpaid
-- staff payment when staff mark the request paid at entry instead.

alter table public.quad_rentals
  add column payment_method text check (payment_method in ('kortele', 'grynais')),
  add column paid_at timestamptz;

comment on column public.quad_rentals.paid_at is 'Set when staff record the rental as paid at entry (cash or card). Online payments are tracked by payment_id.';

create or replace function public.start_staff_payment(p_refs text[])
returns table (payment_id uuid, amount numeric, expires_at timestamptz, stripe_session_id text, customer_email text, items jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refs text[];
  v_items jsonb;
  v_count integer;
  v_open integer;
  v_distinct integer;
  v_existing uuid;
  v_amount numeric;
  v_email text;
  v_phone text;
  p public.payments;
begin
  select array_agg(distinct r) into v_refs from unnest(p_refs) r where r is not null and btrim(r) <> '';
  if v_refs is null or array_length(v_refs, 1) > 10 then
    raise exception 'Invalid request list' using errcode = '23514', hint = 'payment_requests';
  end if;

  -- Staff-source requests that are not cancelled, not paid at entry, and either in no payment or in an unpaid staff payment.
  with req as (
    select 'bookings'::text as tbl, b.id, b.reference, b.total, b.customer_email as email, b.customer_phone as phone,
           b.payment_id as pid, pm.status as pstatus
      from public.bookings b
      left join public.payments pm on pm.id = b.payment_id
     where b.reference = any (v_refs) and b.source in ('telefonu', 'vietoje') and b.status <> 'atsaukta' and b.paid_at is null
       and (b.payment_id is null or (pm.staff_created and pm.status in ('laukia', 'pasibaige', 'nepavyko')))
    union all
    select 'event_tickets', t.id, t.reference, t.total, t.customer_email, t.customer_phone, t.payment_id, pm.status
      from public.event_tickets t
      left join public.payments pm on pm.id = t.payment_id
     where t.reference = any (v_refs) and t.source in ('telefonu', 'vietoje') and t.status <> 'atsaukta' and t.paid_at is null
       and (t.payment_id is null or (pm.staff_created and pm.status in ('laukia', 'pasibaige', 'nepavyko')))
    union all
    select 'quad_rentals', q.id, q.reference, q.total, q.customer_email, q.customer_phone, q.payment_id, pm.status
      from public.quad_rentals q
      left join public.payments pm on pm.id = q.payment_id
     where q.reference = any (v_refs) and q.source in ('telefonu', 'vietoje') and q.status <> 'atsaukta' and q.paid_at is null
       and (q.payment_id is null or (pm.staff_created and pm.status in ('laukia', 'pasibaige', 'nepavyko')))
  )
  select jsonb_agg(jsonb_build_object('tbl', f.tbl, 'id', f.id)), count(*),
         count(*) filter (where f.pstatus = 'laukia'), count(distinct f.pid) filter (where f.pstatus = 'laukia'),
         (min(f.pid::text) filter (where f.pstatus = 'laukia'))::uuid,
         coalesce(sum(f.total), 0),
         min(f.email) filter (where btrim(coalesce(f.email, '')) <> ''),
         min(f.phone) filter (where btrim(coalesce(f.phone, '')) <> '')
    into v_items, v_count, v_open, v_distinct, v_existing, v_amount, v_email, v_phone
    from req f;

  if v_count is distinct from array_length(v_refs, 1) then
    raise exception 'Requests not found or already paid' using errcode = '23514', hint = 'payment_requests';
  end if;

  if v_open > 0 then
    -- Again for a request that already has an open payment: give that one back.
    if v_open <> v_count or v_distinct <> 1 then
      raise exception 'Requests belong to different payments' using errcode = '23514', hint = 'payment_exists';
    end if;
    select * into p from public.payments where id = v_existing for update;
    if p.status <> 'laukia' then
      raise exception 'Payment is not open' using errcode = '23514', hint = 'payment_exists';
    end if;
  else
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
    update public.quad_rentals set payment_id = p.id
     where id in (select (i ->> 'id')::uuid from jsonb_array_elements(v_items) i where i ->> 'tbl' = 'quad_rentals');
  end if;

  return query
    select p.id, p.amount, p.expires_at, p.stripe_session_id, p.customer_email, private.payment_items(p.id);
end;
$$;

-- Staff record a request as paid at entry: its unpaid staff payment is retired and detached (the server expires its
-- Checkout Session first). A payment that was paid or refunded cannot be voided.
create function public.void_staff_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found or not p.staff_created or p.status in ('apmoketa', 'grazinta') then
    raise exception 'Payment cannot be voided' using errcode = '23514', hint = 'payment_settled';
  end if;
  if p.status = 'laukia' then
    update public.payments set status = 'pasibaige' where id = p.id;
  end if;
  update public.bookings set payment_id = null where payment_id = p.id;
  update public.event_tickets set payment_id = null where payment_id = p.id;
  update public.quad_rentals set payment_id = null where payment_id = p.id;
end;
$$;

revoke execute on function public.start_staff_payment(text[]) from public, anon, authenticated;
grant execute on function public.start_staff_payment(text[]) to service_role;
revoke execute on function public.void_staff_payment(uuid) from public, anon, authenticated;
grant execute on function public.void_staff_payment(uuid) to service_role;
