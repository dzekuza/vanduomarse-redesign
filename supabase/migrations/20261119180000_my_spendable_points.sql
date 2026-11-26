-- What the checkout shows a signed-in customer: the points they can spend (the rider private.rider_for_user picks) and what a
-- point is worth. Nothing for a signed-out visitor; a customer record that does not match returns a zero balance.
create function public.my_spendable_points()
returns table (balance integer, point_value_eur numeric, enabled boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(r.points_balance, 0), s.point_value_eur, s.enabled
    from public.loyalty_settings s
    left join public.riders r on r.id = private.rider_for_user((select auth.uid()))
   where s.id and (select auth.uid()) is not null;
$$;
revoke execute on function public.my_spendable_points() from public, anon;
grant execute on function public.my_spendable_points() to authenticated;
