-- Vanduo Marse: a customer sees their own calculator inquiries (Pasiūlymai) on /paskyra.
--
-- Inquiries come from anonymous forms and carry no user_id, so they are linked by contact: an
-- inquiry belongs to the signed-in customer when its e-mail equals their CONFIRMED auth e-mail, or
-- its phone (digits only) equals their CONFIRMED auth phone. Read-only and limited to the fields the
-- customer typed or was quoted; staff notes and the calculator payload stay private.

create function public.my_inquiries()
returns table (
  id uuid,
  created_at timestamptz,
  event_type text,
  date date,
  guests integer,
  space text,
  estimate_min numeric,
  estimate_max numeric,
  status public.inquiry_status,
  accepted boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.created_at, i.event_type, i.date, i.guests, i.space, i.estimate_min, i.estimate_max, i.status,
         i.accepted_at is not null
  from public.inquiries i
  join auth.users u on u.id = (select auth.uid())
  where i.source = 'skaiciuokle'
    and (
      (u.email_confirmed_at is not null and i.customer_email is not null and lower(i.customer_email) = lower(u.email))
      or (
        u.phone_confirmed_at is not null
        and coalesce(u.phone, '') <> ''
        and regexp_replace(coalesce(i.customer_phone, ''), '\D', '', 'g') = regexp_replace(u.phone, '\D', '', 'g')
      )
    )
  order by i.created_at desc;
$$;

revoke execute on function public.my_inquiries() from public, anon;
grant execute on function public.my_inquiries() to authenticated;
