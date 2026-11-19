-- my_points() also says whether the account is a primary match (confirmed e-mail or main phone), like my_riders(), so /paskyra can
-- tell a log that is withheld (second-phone match) from a rider with no movements.
drop function public.my_points();

create function public.my_points()
returns table (rider_id uuid, rider_name text, balance integer, entries jsonb, primary_match boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, btrim(r.name || ' ' || r.surname), r.points_balance,
         case when m.is_primary then coalesce((
           select jsonb_agg(jsonb_build_object('delta', l.delta, 'kind', l.kind, 'reason', l.reason, 'at', l.created_at) order by l.created_at desc)
             from (select * from public.points_ledger x where x.rider_id = r.id order by x.created_at desc limit 50) l
         ), '[]'::jsonb) else '[]'::jsonb end,
         m.is_primary
    from public.riders r
    join auth.users u on u.id = (select auth.uid())
    cross join lateral (select regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') as account_phone) a
    cross join lateral (
      select
        coalesce(u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email), false) as email_match,
        coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9 and a.account_phone = private.normalize_phone(r.phone), false) as phone_match,
        coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9 and a.account_phone = private.normalize_phone(r.phone2), false) as phone2_match
    ) q
    cross join lateral (select (q.email_match or q.phone_match) as is_primary) m
   where not r.needs_review
     and (q.email_match or q.phone_match or q.phone2_match)
   order by r.created_at;
$$;
revoke execute on function public.my_points() from public, anon;
grant execute on function public.my_points() to authenticated;
