-- Vanduo Marse: rules the database enforces on its own, plus the read-only
-- availability functions the public site calls instead of reading bookings.
-- Conflicts raise SQLSTATE 23P01 (exclusion_violation) so the app can map
-- every "already taken" case to one form error.

-- ---------------------------------------------------------------------------
-- References: PM-1001 (sauna), MM-1001 (stays), PR-1001 (event tickets)
-- ---------------------------------------------------------------------------

create function public.set_booking_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := case
      when new.kind = 'pirtis' then 'PM-' || nextval('public.booking_reference_pm_seq')
      else 'MM-' || nextval('public.booking_reference_mm_seq')
    end;
  end if;
  return new;
end;
$$;

create trigger bookings_reference before insert on public.bookings
  for each row execute function public.set_booking_reference();

create function public.set_ticket_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := 'PR-' || nextval('public.ticket_reference_seq');
  end if;
  return new;
end;
$$;

create trigger event_tickets_reference before insert on public.event_tickets
  for each row execute function public.set_ticket_reference();

-- ---------------------------------------------------------------------------
-- Sauna: a live session may not cover an hour closed by staff, and staff may
-- not close an hour a live session covers. Overlapping sessions are handled
-- by the bookings_no_sauna_overlap exclusion constraint.
-- ---------------------------------------------------------------------------

create function public.enforce_sauna_block_free()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_hour smallint;
begin
  if new.kind <> 'pirtis' or new.status = 'atsaukta' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('sauna:' || new.date));

  select b.hour into v_hour
  from public.sauna_blocks b
  where b.date = new.date
    and b.hour >= new.start_hour
    and b.hour < new.start_hour + new.hours
  order by b.hour
  limit 1;

  if found then
    raise exception 'Sauna hour %:00 on % is closed', v_hour, new.date
      using errcode = '23P01', hint = 'sauna_blocked';
  end if;
  return new;
end;
$$;

create trigger bookings_sauna_block_free
  before insert or update of kind, date, start_hour, hours, status on public.bookings
  for each row execute function public.enforce_sauna_block_free();

create function public.enforce_block_not_booked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('sauna:' || new.date));

  if exists (
    select 1
    from public.bookings b
    where b.kind = 'pirtis'
      and b.status <> 'atsaukta'
      and b.date = new.date
      and new.hour >= b.start_hour
      and new.hour < b.start_hour + b.hours
  ) then
    raise exception 'Sauna hour %:00 on % is already booked', new.hour, new.date
      using errcode = '23P01', hint = 'sauna_booked';
  end if;
  return new;
end;
$$;

create trigger sauna_blocks_not_booked
  before insert or update of date, hour on public.sauna_blocks
  for each row execute function public.enforce_block_not_booked();

-- ---------------------------------------------------------------------------
-- Stays: never sell more cabins of a size than exist on any night.
-- ---------------------------------------------------------------------------

create function public.enforce_stay_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_units smallint;
  v_full date;
begin
  if new.kind = 'pirtis' or new.status = 'atsaukta' then
    return new;
  end if;

  select t.units into v_units from public.stay_types t where t.id = new.stay_type_id;
  if v_units is null then
    return new; -- unlimited (camper pitches)
  end if;

  perform pg_advisory_xact_lock(hashtext('stay:' || new.stay_type_id));

  select night::date into v_full
  from generate_series(new.date, new.date + new.nights - 1, interval '1 day') as night
  where (
    select count(*)
    from public.bookings b
    where b.stay_type_id = new.stay_type_id
      and b.status <> 'atsaukta'
      and b.id <> new.id
      and b.date <= night::date
      and night::date < b.date + b.nights
  ) >= v_units
  order by night
  limit 1;

  if found then
    raise exception 'No % left for the night of %', new.stay_type_id, v_full
      using errcode = '23P01', hint = 'stay_full';
  end if;
  return new;
end;
$$;

create trigger bookings_stay_capacity
  before insert or update of kind, date, nights, stay_type_id, status on public.bookings
  for each row execute function public.enforce_stay_capacity();

-- ---------------------------------------------------------------------------
-- Event tickets: respect capacity and keep events.sold in step.
-- ---------------------------------------------------------------------------

create function public.enforce_ticket_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_capacity integer;
  v_taken integer;
begin
  if new.status = 'atsaukta' then
    return new;
  end if;

  -- Row lock serialises concurrent ticket sales for the same event.
  select e.capacity into v_capacity from public.events e where e.id = new.event_id for update;
  if v_capacity is null then
    return new;
  end if;

  select coalesce(sum(t.people), 0) into v_taken
  from public.event_tickets t
  where t.event_id = new.event_id and t.status <> 'atsaukta' and t.id <> new.id;

  if v_taken + new.people > v_capacity then
    raise exception 'Only % spots left', greatest(v_capacity - v_taken, 0)
      using errcode = '23P01', hint = 'event_full';
  end if;
  return new;
end;
$$;

create trigger event_tickets_capacity
  before insert or update of event_id, people, status on public.event_tickets
  for each row execute function public.enforce_ticket_capacity();

create function public.sync_event_sold()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_event uuid;
begin
  for v_event in
    select distinct x from unnest(array[
      case when tg_op <> 'INSERT' then old.event_id end,
      case when tg_op <> 'DELETE' then new.event_id end
    ]) as x where x is not null
  loop
    update public.events e
    set sold = (
      select coalesce(sum(t.people), 0)
      from public.event_tickets t
      where t.event_id = v_event and t.status <> 'atsaukta'
    )
    where e.id = v_event;
  end loop;
  return null;
end;
$$;

create trigger event_tickets_sync_sold
  after insert or update or delete on public.event_tickets
  for each row execute function public.sync_event_sold();

-- ---------------------------------------------------------------------------
-- Public availability (no customer data). SECURITY DEFINER so anon can call
-- them while bookings stay closed to anon.
-- ---------------------------------------------------------------------------

create function public.sauna_taken_hours(p_from date, p_to date)
returns table (day date, hour smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 370 then
    raise exception 'Range must be 0-370 days' using errcode = '22023';
  end if;

  return query
    select b.date, h::smallint
    from public.bookings b
    cross join lateral generate_series(b.start_hour, b.start_hour + b.hours - 1) as h
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date between p_from and p_to
    union
    select s.date, s.hour
    from public.sauna_blocks s
    where s.date between p_from and p_to
    order by 1, 2;
end;
$$;

comment on function public.sauna_taken_hours is 'Booked or closed sauna hours per day, for the public start-time grid.';

create function public.stay_occupancy(p_from date, p_to date)
returns table (day date, stay_type_id text, taken integer, units smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 370 then
    raise exception 'Range must be 0-370 days' using errcode = '22023';
  end if;

  return query
    select d::date, t.id, count(b.id)::integer, t.units
    from generate_series(p_from, p_to, interval '1 day') as d
    cross join public.stay_types t
    left join public.bookings b
      on b.stay_type_id = t.id
     and b.status <> 'atsaukta'
     and b.date <= d::date
     and d::date < b.date + b.nights
    where t.active
    group by d, t.id, t.units, t.sort_order
    order by d, t.sort_order;
end;
$$;

comment on function public.stay_occupancy is 'Nights taken per stay type per day (units null = unlimited).';

revoke execute on function public.sauna_taken_hours(date, date) from public;
revoke execute on function public.stay_occupancy(date, date) from public;
grant execute on function public.sauna_taken_hours(date, date) to anon, authenticated;
grant execute on function public.stay_occupancy(date, date) to anon, authenticated;

-- Trigger functions are never called directly.
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_booking_reference() from public;
revoke execute on function public.set_ticket_reference() from public;
revoke execute on function public.enforce_sauna_block_free() from public;
revoke execute on function public.enforce_block_not_booked() from public;
revoke execute on function public.enforce_stay_capacity() from public;
revoke execute on function public.enforce_ticket_capacity() from public;
revoke execute on function public.sync_event_sold() from public;
