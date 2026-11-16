-- The plan payment return page labels a campaign sale for GA / Meta with the order's discount code (ADR-0106).
-- It reads the order only through this scoped function; adding the code here keeps that page off the table itself.
-- The return type changes, so the function is dropped and recreated with the same body, security and grants.
drop function if exists public.plan_order_state(text);

create function public.plan_order_state(p_session_id text)
returns table (status text, reference text, plan_name text, price numeric, rider_email text, discount_code text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.status, o.reference, o.plan_name, o.price, coalesce(r.email, ''), o.discount_code
    from public.rider_plan_orders o join public.riders r on r.id = o.rider_id
   where o.stripe_session_id = p_session_id;
$$;

revoke execute on function public.plan_order_state(text) from public, anon, authenticated;
grant execute on function public.plan_order_state(text) to service_role;
