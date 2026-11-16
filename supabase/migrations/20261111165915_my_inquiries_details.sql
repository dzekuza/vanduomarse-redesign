-- Vanduo Marse: /paskyra -> Pasiūlymai opens a popup with the whole quote.
--
-- Widens my_inquiries() (20261111190000) with what the customer typed or was shown: their contact
-- details, their comment and the breakdown lines of the estimate (calculator_input -> 'lines').
-- Still limited to the customer's own inquiries (confirmed e-mail or phone match). The rest of the
-- calculator payload and the staff notes stay private. The return type changes, so the function is
-- dropped and recreated.

drop function public.my_inquiries();

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
  accepted boolean,
  message text,
  lines jsonb,
  contact_name text,
  contact_phone text,
  contact_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.created_at, i.event_type, i.date, i.guests, i.space, i.estimate_min, i.estimate_max, i.status,
         i.accepted_at is not null,
         i.message,
         case when jsonb_typeof(i.calculator_input -> 'lines') = 'array' then i.calculator_input -> 'lines' else '[]'::jsonb end,
         i.customer_name, i.customer_phone, i.customer_email
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
