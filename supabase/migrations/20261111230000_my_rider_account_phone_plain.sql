-- Vanduo Marse: my_riders() normalises only the staff-entered phone.
--
-- 20261111220000_my_rider_exact_phone.sql ran private.normalize_phone() on auth.users.phone too.
-- That column is already E.164 digits, so the Lithuanian trunk rules (8XXXXXXXX, 6XXXXXXX) must not
-- apply to it: a foreign 9-digit account number starting with 8 or 6 would be rewritten to 370...
-- and could match a Lithuanian rider. The account phone is now compared as plain digits.

create or replace function public.my_riders()
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
