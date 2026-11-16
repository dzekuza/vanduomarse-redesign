-- Vanduo Marse: my_riders() matches phones exactly, not by their last 8 digits.
--
-- 20261111210000_my_rider.sql compared the last 8 digits so that staff-entered local numbers
-- ("8 612 34567") matched E.164 accounts ("+37061234567"). A suffix match can also match a foreign
-- number that happens to end in the same digits, so a different person could see a rider's plan.
-- Both sides are now normalised to full international digits and compared for equality:
--   00370..., +370...  -> 370...        (international prefix removed)
--   8XXXXXXXX          -> 370XXXXXXXX   (Lithuanian trunk prefix 8)
--   6XXXXXXX           -> 3706XXXXXXX   (Lithuanian mobile without prefix)
-- Anything else is compared as its digits, so numbers from other countries only match themselves.

create function private.normalize_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d = '' then ''
    when d ~ '^00' then substr(d, 3)
    when d ~ '^8\d{8}$' then '370' || substr(d, 2)
    when d ~ '^6\d{7}$' then '370' || d
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s;
$$;

revoke execute on function private.normalize_phone(text) from public, anon;

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
  where (
      (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
      or (
        u.phone_confirmed_at is not null
        and length(private.normalize_phone(u.phone)) >= 9
        and private.normalize_phone(u.phone) in (private.normalize_phone(r.phone), private.normalize_phone(r.phone2))
      )
    )
  order by r.created_at;
$$;
