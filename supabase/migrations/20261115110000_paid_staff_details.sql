-- Who paid and what for, for the staff notification of a paid reservation (SMS, e-mail, push).
-- One row per request of the payment, joined to `paid_request_details` by reference.
-- people = guests / riders / ticket holders; units = quads or cabin units (null when it does not apply).
create function public.paid_staff_details(p_payment_id uuid)
returns table (reference text, customer_name text, customer_email text, customer_phone text, people integer, units integer, total numeric, discount_code text, note text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.reference, b.customer_name, b.customer_email, b.customer_phone, b.guests::integer,
         case when b.kind = 'pirtis' then null else b.stay_units::integer end,
         b.total, b.discount_code, b.note
    from public.bookings b where b.payment_id = p_payment_id
  union all
  select q.reference, q.customer_name, q.customer_email, q.customer_phone, q.riders::integer, q.units::integer,
         q.total, q.discount_code, q.note
    from public.quad_rentals q where q.payment_id = p_payment_id
  union all
  select t.reference, t.customer_name, t.customer_email, t.customer_phone, (t.people + t.children)::integer, null::integer,
         t.total, t.discount_code, null::text
    from public.event_tickets t where t.payment_id = p_payment_id
  order by 1;
$$;

revoke execute on function public.paid_staff_details(uuid) from public, anon, authenticated;
grant execute on function public.paid_staff_details(uuid) to service_role;
