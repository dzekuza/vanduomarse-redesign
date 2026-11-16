-- A paid reservation needs no staff confirmation (ADR-0079): complete_payment confirms its requests itself,
-- unless the payment needs a manual look (odd amount, or the slots could not be restored after a late payment).
-- paid_request_details gives the webhook what the customer's confirmation message lists.

drop function public.complete_payment(text, text, numeric, uuid);

create function public.complete_payment(p_session_id text, p_payment_intent text, p_amount numeric, p_payment_id uuid default null)
returns table (newly_paid boolean, payment_id uuid, phone text, amount numeric, refs text[], needs_review boolean, duplicate boolean, confirmed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  v_review boolean := false;
  v_dup boolean := false;
begin
  select * into p from public.payments where stripe_session_id = p_session_id for update;
  if not found and p_payment_id is not null then
    -- Paid through a session that is no longer the current one: the id travels in its metadata.
    select * into p from public.payments where id = p_payment_id for update;
  end if;
  if not found then
    return;
  end if;

  if p.status in ('apmoketa', 'grazinta') then
    -- Stripe retries events; only a different payment intent is a second charge.
    v_dup := coalesce(nullif(p_payment_intent, ''), '') <> ''
             and p.stripe_payment_intent_id is not null
             and p.stripe_payment_intent_id <> p_payment_intent;
    if v_dup and not p.needs_review then
      update public.payments pm set needs_review = true where pm.id = p.id returning * into p;
    end if;
    return query select false, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review, v_dup, false;
    return;
  end if;

  if p.status in ('pasibaige', 'nepavyko') then
    -- Paid after we released the slots: bring the requests back if they are still free.
    begin
      update public.bookings bk set status = 'laukia' where bk.payment_id = p.id and bk.status = 'atsaukta';
      update public.quad_rentals qr set status = 'laukia' where qr.payment_id = p.id and qr.status = 'atsaukta';
      update public.event_tickets et set status = 'laukia' where et.payment_id = p.id and et.status = 'atsaukta';
    exception when others then
      v_review := true;
    end;
  end if;

  if p_amount is not null and p_amount <> p.amount then
    v_review := true;
  end if;

  update public.payments pm
     set status = 'apmoketa', paid_at = now(),
         stripe_session_id = p_session_id,
         stripe_payment_intent_id = coalesce(nullif(p_payment_intent, ''), pm.stripe_payment_intent_id),
         needs_review = pm.needs_review or v_review
   where pm.id = p.id
   returning * into p;

  -- Paid in full for what was held: confirm it now. Anything that needs a look stays pending for staff.
  if not p.needs_review then
    update public.bookings bk set status = 'patvirtinta' where bk.payment_id = p.id and bk.status = 'laukia';
    update public.quad_rentals qr set status = 'patvirtinta' where qr.payment_id = p.id and qr.status = 'laukia';
    update public.event_tickets et set status = 'patvirtinta' where et.payment_id = p.id and et.status = 'laukia';
  end if;

  return query select true, p.id, p.customer_phone, p.amount, private.payment_refs(p.id), p.needs_review, false, not p.needs_review;
end;
$$;

revoke execute on function public.complete_payment(text, text, numeric, uuid) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, numeric, uuid) to service_role;

-- One row per request of a payment: what it is, when, for the customer's confirmation message.
-- service: pirtis | nakvyne | keturraciai | renginys. Times are "HH:MM" (end empty when unknown).
create function public.paid_request_details(p_payment_id uuid)
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
         case when e.tour_route_id is not null then 'keturraciai' when e.program_id is not null then 'pirtis' else 'renginys' end,
         e.title, e.date,
         left(e.start_time::text, 5),
         case when e.duration_minutes is not null then left((e.start_time + make_interval(mins => e.duration_minutes))::text, 5) end,
         null::integer
    from public.event_tickets t
    join public.events e on e.id = t.event_id
   where t.payment_id = p_payment_id
  order by 1;
$$;

revoke execute on function public.paid_request_details(uuid) from public, anon, authenticated;
grant execute on function public.paid_request_details(uuid) to service_role;
