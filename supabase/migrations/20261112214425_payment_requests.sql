-- What a payment paid for, for the return page /rezervacija/mokejimas: one row per request with the service, the date and time,
-- nights, units and guests. No names, phones or e-mails: the page is reached by an unguessable payment id and stays free of
-- personal data. Service role only (the page reads it on the server).
create function public.payment_requests(p_payment_id uuid)
returns table (
  reference text, kind text, title text, date date, start_hour integer, hours integer, nights integer,
  units integer, guests integer, start_time text, total numeric, status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.reference,
         case b.kind when 'pirtis' then 'pirtis' when 'kemperis' then 'kemperis' else 'namelis' end,
         coalesce(s.name, st.label, case b.kind when 'pirtis' then 'Pirtis' else 'Nakvynė' end),
         b.date, b.start_hour, b.hours, b.nights, b.stay_units, b.guests, null::text, b.total, b.status::text
    from public.bookings b
    left join public.saunas s on s.id = b.sauna_id
    left join public.stay_types st on st.id = b.stay_type_id
   where b.payment_id = p_payment_id
  union all
  select q.reference, 'keturraciai', coalesce(qt.name, 'Keturračiai'), q.date, q.start_hour, q.hours, null, q.units, q.riders, null::text, q.total, q.status::text
    from public.quad_rentals q
    left join public.quad_types qt on qt.id = q.quad_type_id
   where q.payment_id = p_payment_id
  union all
  select t.reference, 'renginys', e.title, e.date, null, null, null, null, t.people, to_char(e.start_time, 'HH24:MI'), t.total, t.status::text
    from public.event_tickets t
    join public.events e on e.id = t.event_id
   where t.payment_id = p_payment_id
  order by 1;
$$;

revoke execute on function public.payment_requests(uuid) from public, anon, authenticated;
grant execute on function public.payment_requests(uuid) to service_role;
