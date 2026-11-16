-- my_riders() returns registration details only for riders whose OWN contact the account has confirmed.
-- Security review of 20261113170000: a rider is also matched by `phone2`, a staff-entered secondary number that may
-- belong to someone else (a parent, an emergency contact), and that match returned the rider's birthdate, e-mail,
-- phones and photo. Now `primary_match` is true only when the confirmed account e-mail equals `riders.email`, or the
-- confirmed account phone equals `riders.phone`. A `phone2`-only match still returns name, plan, bracelets and
-- purchases (ADR-0062) but every registration field is null. The return type changes, so the function is dropped
-- and recreated with the same grants.

drop function public.my_riders();

create function public.my_riders()
returns table (
  id uuid,
  name text,
  surname text,
  plan_name text,
  plan_description text,
  plan_category text,
  plan_price numeric,
  cards text[],
  purchases jsonb,
  registered boolean,
  email text,
  phone text,
  phone2 text,
  birthdate date,
  avatar_path text,
  signed_at timestamptz,
  terms_version text,
  primary_match boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.name, r.surname,
         p.name, p.description, p.category, p.price,
         coalesce((select array_agg(c.card_number order by c.bound_at) from public.rider_cards c where c.rider_id = r.id), '{}'),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'planName', x.plan_name, 'category', x.plan_category, 'price', x.price, 'soldAt', x.sold_at
                  ) order by x.sold_at desc)
           from public.purchases x where x.rider_id = r.id
         ), '[]'::jsonb),
         (r.avatar_path is not null and w.id is not null),
         case when m.is_primary then r.email end,
         case when m.is_primary then r.phone end,
         case when m.is_primary then r.phone2 end,
         case when m.is_primary then r.birthdate end,
         case when m.is_primary then r.avatar_path end,
         case when m.is_primary then w.signed_at end,
         case when m.is_primary then w.terms_version end,
         m.is_primary
  from public.riders r
  left join public.ride_plans p on p.id = r.plan_id
  left join lateral (
    select x.id, x.signed_at, x.terms_version
      from public.rider_waivers x
     where x.rider_id = r.id and x.signature_path is not null
     order by x.signed_at desc
     limit 1
  ) w on true
  join auth.users u on u.id = (select auth.uid())
  cross join lateral (select regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') as account_phone) a
  cross join lateral (
    select
      coalesce(u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email), false) as email_match,
      coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9
               and a.account_phone = private.normalize_phone(r.phone), false) as phone_match,
      coalesce(u.phone_confirmed_at is not null and length(a.account_phone) >= 9
               and a.account_phone = private.normalize_phone(r.phone2), false) as phone2_match
  ) q
  cross join lateral (select (q.email_match or q.phone_match) as is_primary) m
  where q.email_match or q.phone_match or q.phone2_match
  order by r.created_at;
$$;

revoke execute on function public.my_riders() from public, anon;
grant execute on function public.my_riders() to authenticated;
