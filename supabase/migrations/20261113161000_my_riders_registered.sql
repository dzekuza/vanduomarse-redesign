-- my_riders() also says whether the rider finished /registracija (profile photo and a signed waiver),
-- so /paskyra can offer "Užbaigti registraciją". The body is the same as 20261111230000 plus `registered`.
-- The return type changes, so the function is dropped and recreated with the same grants.

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
  registered boolean
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
         (r.avatar_path is not null and exists (
           select 1 from public.rider_waivers w where w.rider_id = r.id and w.signature_path is not null
         ))
  from public.riders r
  left join public.ride_plans p on p.id = r.plan_id
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
