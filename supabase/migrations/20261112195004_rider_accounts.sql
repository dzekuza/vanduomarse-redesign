-- Which customers have a site account: a confirmed login whose e-mail, or whose confirmed phone (last 8 digits),
-- matches the rider. The same matching as my_riders() uses for the customer's own page. For /admin/klientai; staff
-- with the Klientai or Apyrankės page only (auth.users is otherwise unreadable). Returns ids only, no contact data.
create or replace function public.rider_accounts()
returns table (rider_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
  from public.riders r
  where (private.has_permission('klientai') or private.has_permission('apyrankes'))
    and exists (
      select 1 from auth.users u
      where (u.email_confirmed_at is not null and r.email is not null and lower(r.email) = lower(u.email))
         or (
           u.phone_confirmed_at is not null
           and length(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g')) >= 8
           and right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 8) in (
             right(regexp_replace(coalesce(r.phone, ''), '\D', '', 'g'), 8),
             right(regexp_replace(coalesce(r.phone2, ''), '\D', '', 'g'), 8)
           )
         )
    );
$$;

revoke execute on function public.rider_accounts() from public, anon;
grant execute on function public.rider_accounts() to authenticated;
