-- Sauna sessions are events with category 'pirtis' (program_id is empty for them), so the confirmation says
-- "Pirties seansas" for them (ADR-0079). Same signature as before, so grants stay.

create or replace function public.paid_request_details(p_payment_id uuid)
returns table (reference text, service text, title text, day date, start_time text, end_time text, nights integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.reference,
         case b.kind when 'pirtis' then 'pirtis' else 'nakvyne' end,
         case b.kind when 'pirtis' then coalesce(s.name, 'Pirtis') else coalesce(st.label, 'Nakvynė') end,
         b.date,
         case when b.start_hour is not null then lpad(b.start_hour::integer::text, 2, '0') || ':00' end,
         case when b.start_hour is not null and b.hours is not null then lpad((b.start_hour + b.hours)::integer::text, 2, '0') || ':00' end,
         b.nights::integer
    from public.bookings b
    left join public.saunas s on s.id = b.sauna_id
    left join public.stay_types st on st.id = b.stay_type_id
   where b.payment_id = p_payment_id
  union all
  select q.reference, 'keturraciai', coalesce(r.name, 'Keturračiai'), q.date,
         lpad(q.start_hour::integer::text, 2, '0') || ':00',
         lpad((q.start_hour + q.hours)::integer::text, 2, '0') || ':00',
         null::integer
    from public.quad_rentals q
    left join public.quad_tour_routes r on r.id = q.tour_route_id
   where q.payment_id = p_payment_id
  union all
  select t.reference,
         case when e.tour_route_id is not null then 'keturraciai' when e.category = 'pirtis' or e.program_id is not null then 'pirtis' else 'renginys' end,
         e.title, e.date,
         left(e.start_time::text, 5),
         case when e.duration_minutes is not null then left((e.start_time + make_interval(mins => e.duration_minutes))::text, 5) end,
         null::integer
    from public.event_tickets t
    join public.events e on e.id = t.event_id
   where t.payment_id = p_payment_id
  order by 1;
$$;
