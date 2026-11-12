-- my_riders() also returns the customer's own registration details (contacts, birthdate, photo path, when and under
-- which terms version the rules were signed), so /paskyra can show "Mano registracija". Still only rider rows matched
-- to the signed-in account by confirmed contact; no staff comments, documents or ride sessions. The signature image
-- stays private. The return type changes, so the function is dropped and recreated with the same grants.

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
  terms_version text
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
         r.email, r.phone, r.phone2, r.birthdate, r.avatar_path,
         w.signed_at, w.terms_version
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
  where (
      (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
      or (
        u.phone_confirmed_at is not null
        and length(a.account_phone) >= 9
        and a.account_phone in (private.normalize_phone(r.phone), private.normalize_phone(r.phone2))
      )
    )
  order by r.created_at;
$$;

revoke execute on function public.my_riders() from public, anon;
grant execute on function public.my_riders() to authenticated;
