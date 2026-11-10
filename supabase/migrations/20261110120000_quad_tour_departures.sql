-- Vanduo Marse: dated departures of quad tour products (ADR-0055).
--
-- A tour product (quad_tour_routes: Mini / Midi / Maxi) is now sold on dates the owner
-- schedules, like a sauna program is sold through its sessions. A departure is a row of
-- public.events (category keturratis) that points at its route; its `capacity` is the
-- number of quads that can join it and `sold` the quads already booked.
--
-- Additive only: two columns, a sold-sync trigger, three policies and one function.
-- create_quad_tour_rental() (fleet allocation, gear and discount pricing) is reused as is.

alter table public.events
  add column tour_route_id text references public.quad_tour_routes (id) on update cascade on delete restrict,
  add constraint events_tour_route_is_quad check (tour_route_id is null or category = 'keturratis');

create index events_tour_route_idx on public.events (tour_route_id, date) where tour_route_id is not null;

alter table public.quad_rentals
  add column tour_event_id uuid references public.events (id) on update cascade on delete restrict;

create index quad_rentals_tour_event_idx on public.quad_rentals (tour_event_id) where tour_event_id is not null;

-- ---------------------------------------------------------------------------
-- events.sold for a departure = quads in its non-cancelled bookings
-- ---------------------------------------------------------------------------

create function private.sync_tour_event_sold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[] := '{}';
begin
  if tg_op in ('UPDATE', 'DELETE') and old.tour_event_id is not null then
    v_ids := array_append(v_ids, old.tour_event_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.tour_event_id is not null then
    v_ids := array_append(v_ids, new.tour_event_id);
  end if;
  if cardinality(v_ids) > 0 then
    update public.events ev
    set sold = coalesce((
      select sum(q.units)::integer from public.quad_rentals q
      where q.tour_event_id = ev.id and q.status <> 'atsaukta'
    ), 0)
    where ev.id = any (v_ids);
  end if;
  return null;
end;
$$;

revoke execute on function private.sync_tour_event_sold() from public, anon, authenticated;

create trigger quad_rentals_sync_tour_sold
  after insert or update of status, units, tour_event_id or delete on public.quad_rentals
  for each row execute function private.sync_tour_event_sold();

-- ---------------------------------------------------------------------------
-- Staff with `keturraciai` manage the departures (events of category keturratis)
-- ---------------------------------------------------------------------------

create policy "keturraciai tour events insert" on public.events
  for insert to authenticated with check (category = 'keturratis' and (select private.has_permission('keturraciai')));
create policy "keturraciai tour events update" on public.events
  for update to authenticated
  using (category = 'keturratis' and (select private.has_permission('keturraciai')))
  with check (category = 'keturratis' and (select private.has_permission('keturraciai')));
create policy "keturraciai tour events delete" on public.events
  for delete to authenticated using (category = 'keturratis' and (select private.has_permission('keturraciai')));

-- ---------------------------------------------------------------------------
-- Request: N quads on a published departure
--
-- Date and start hour come from the departure, never from the caller. The departure's
-- quad capacity is checked under a lock, then create_quad_tour_rental() prices the
-- tour from the route and gear rows and takes the quads from the fleet.
-- ---------------------------------------------------------------------------

create function public.create_quad_tour_departure_rental(
  p_event_id uuid,
  p_units smallint,
  p_accessories jsonb,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.events;
  v_taken integer;
  r record;
begin
  select * into ev from public.events x
  where x.id = p_event_id and x.published and x.category = 'keturratis' and x.tour_route_id is not null;
  if not found then
    raise exception 'Tour departure unavailable' using errcode = '23503', hint = 'quad_tour_unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtext('quad-tour-event:' || p_event_id::text));
  if ev.capacity is not null then
    select coalesce(sum(q.units), 0) into v_taken
    from public.quad_rentals q where q.tour_event_id = ev.id and q.status <> 'atsaukta';
    if v_taken + coalesce(p_units, 0) > ev.capacity then
      raise exception 'Departure is full' using errcode = '23P01', hint = 'quad_full';
    end if;
  end if;

  select * into r from public.create_quad_tour_rental(
    ev.tour_route_id, ev.date, extract(hour from ev.start_time)::smallint, p_units, p_accessories,
    p_name, p_email, p_phone, p_note, p_discount_code
  );
  update public.quad_rentals set tour_event_id = ev.id where quad_rentals.id = r.id;

  return query select r.id, r.reference, r.total, r.code_discount;
end;
$$;

revoke execute on function public.create_quad_tour_departure_rental(uuid, smallint, jsonb, text, text, text, text, text) from public;
grant execute on function public.create_quad_tour_departure_rental(uuid, smallint, jsonb, text, text, text, text, text) to anon, authenticated, service_role;

comment on column public.events.tour_route_id is 'Set for a dated departure of a quad tour product (quad_tour_routes); capacity = quads, sold = quads booked.';
comment on column public.quad_rentals.tour_event_id is 'The departure (events row) a tour booking joined; null for rentals and legacy tour bookings.';
