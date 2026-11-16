-- Vanduo Marse: a customer sees their wakeboard plan (apyrankė) on /paskyra -> Vandenlentės.
--
-- `riders` rows come from staff, the Grabby import and /registracija, and carry no auth user id, so
-- they are linked by contact, as with my_inquiries(): a rider belongs to the signed-in customer when
-- its e-mail equals their CONFIRMED auth e-mail, or one of its phones matches their CONFIRMED auth
-- phone. Phones are compared by their last 8 digits, because staff-entered numbers are often saved
-- in local form ("8 612 34567") while accounts use E.164 ("+37061234567").
-- Read-only; it returns the rider's name, current plan, bracelet numbers and plan purchases only
-- (no staff comments, documents, waivers, photos or ride sessions).

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
  purchases jsonb
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
         ), '[]'::jsonb)
  from public.riders r
  left join public.ride_plans p on p.id = r.plan_id
  join auth.users u on u.id = (select auth.uid())
  where (
      (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
      or (
        u.phone_confirmed_at is not null
        and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 8
        and right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 8) in (
          right(regexp_replace(coalesce(r.phone, ''), '\D', '', 'g'), 8),
          right(regexp_replace(coalesce(r.phone2, ''), '\D', '', 'g'), 8)
        )
      )
    )
  order by r.created_at;
$$;

revoke execute on function public.my_riders() from public, anon;
grant execute on function public.my_riders() to authenticated;
