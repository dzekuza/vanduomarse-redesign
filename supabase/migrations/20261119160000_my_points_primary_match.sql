-- my_points(): same split as my_riders() (security review of the phone2 follow-up). A confirmed e-mail or the rider's main phone is
-- a primary match and sees the balance and the log. A match through the second phone only (often a parent's or friend's number)
-- sees the balance but no log, because the staff-written reasons in it can hold details about someone else.
create or replace function public.my_points()
returns table (rider_id uuid, rider_name text, balance integer, entries jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, btrim(r.name || ' ' || r.surname), r.points_balance,
         case when m.is_primary then coalesce((
           select jsonb_agg(jsonb_build_object('delta', l.delta, 'kind', l.kind, 'reason', l.reason, 'at', l.created_at) order by l.created_at desc)
             from (select * from public.points_ledger x where x.rider_id = r.id order by x.created_at desc limit 50) l
         ), '[]'::jsonb) else '[]'::jsonb end
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
