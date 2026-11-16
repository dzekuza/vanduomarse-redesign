-- The coupon payment page shows the code once paid (the Checkout Session id in the URL is unguessable), offers a printable
-- voucher, and lets the buyer ask for the email again (at most once every 2 minutes per coupon).
-- Also: discount_code_usage() counts the discount given on coupon purchases.

alter table public.coupons add column last_emailed_at timestamptz;

drop function public.coupon_payment_state(text);

create function public.coupon_payment_state(p_session_id text)
returns table (
  status public.coupon_status, reference text, product_name text, face_value numeric, has_recipient boolean,
  code text, expires_at date, service public.coupon_service, buyer_name text, recipient_name text, message text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.status, c.reference, c.product_name, c.face_value, c.recipient_email <> '',
         case when c.status in ('aktyvus', 'panaudotas') then c.code end, c.expires_at, c.service,
         c.buyer_name, c.recipient_name, c.message
    from public.coupons c where c.stripe_session_id = p_session_id;
$$;

-- allowed = false while the previous send is under 2 minutes old (retry_in = seconds left).
create function public.resend_coupon_email(p_session_id text)
returns table (
  allowed boolean, retry_in integer, code text, expires_at date, service public.coupon_service, buyer_name text,
  buyer_email text, recipient_name text, message text, product_name text, face_value numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.coupons;
  v_wait integer := 0;
begin
  select * into c from public.coupons x where x.stripe_session_id = p_session_id and x.status = 'aktyvus' for update;
  if not found then
    return;
  end if;
  if c.last_emailed_at is not null and c.last_emailed_at > now() - interval '2 minutes' then
    v_wait := ceil(extract(epoch from (c.last_emailed_at + interval '2 minutes' - now())))::integer;
  else
    update public.coupons set last_emailed_at = now() where id = c.id;
  end if;
  return query select (v_wait = 0), v_wait, c.code, c.expires_at, c.service, c.buyer_name, c.buyer_email,
                      c.recipient_name, c.message, c.product_name, c.face_value;
end;
$$;

revoke execute on function public.coupon_payment_state(text) from public, anon, authenticated;
revoke execute on function public.resend_coupon_email(text) from public, anon, authenticated;
grant execute on function public.coupon_payment_state(text) to service_role;
grant execute on function public.resend_coupon_email(text) to service_role;

create or replace function public.discount_code_usage()
returns table (code_id uuid, uses integer, discount_total numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('nuolaidos') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
    select d.id, private.discount_code_uses(d.id),
           coalesce((select sum(r.amount) from (
              select b.discount_amount as amount from public.bookings b where b.discount_code_id = d.id and b.status <> 'atsaukta'
              union all
              select q.discount_amount from public.quad_rentals q where q.discount_code_id = d.id and q.status <> 'atsaukta'
              union all
              select t.discount_amount from public.event_tickets t where t.discount_code_id = d.id and t.status <> 'atsaukta'
              union all
              select c.discount_amount from public.coupons c where c.discount_code_id = d.id and c.status <> 'atsauktas'
            ) r), 0)
    from public.discount_codes d;
end;
$$;
