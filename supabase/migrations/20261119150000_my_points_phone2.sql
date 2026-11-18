-- my_points(): also match riders through their second phone (phone2), like my_riders() does, so a customer who signs in with
-- a confirmed secondary number still sees that rider's balance and log.
create or replace function public.my_points()
returns table (rider_id uuid, rider_name text, balance integer, entries jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, btrim(r.name || ' ' || r.surname), r.points_balance,
         coalesce((
           select jsonb_agg(jsonb_build_object('delta', l.delta, 'kind', l.kind, 'reason', l.reason, 'at', l.created_at) order by l.created_at desc)
             from (select * from public.points_ledger x where x.rider_id = r.id order by x.created_at desc limit 50) l
         ), '[]'::jsonb)
    from public.riders r
    join auth.users u on u.id = (select auth.uid())
   where not r.needs_review
     and (
       (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
       or (u.phone_confirmed_at is not null
           and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 9
           and regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') in (private.normalize_phone(r.phone), private.normalize_phone(r.phone2)))
     )
   order by r.created_at;
$$;
revoke execute on function public.my_points() from public, anon;
grant execute on function public.my_points() to authenticated;
