-- Published sauna sessions occupy Pirtis Marse. The schedule is the source for
-- both the public availability grid and the private booking conflict check.

create function private.sauna_event_slot(
  p_date date, p_start time, p_duration smallint, p_program_id text
)
returns tsrange
language sql
stable
set search_path = ''
as $$
  select tsrange(
    p_date + p_start,
    p_date + p_start + make_interval(mins => coalesce(
      p_duration,
      (select p.duration_minutes from public.sauna_programs p
       where p.id = p_program_id and p.kind = 'session'),
      60
    )),
    '[)'
  );
$$;

create function private.published_sauna_slots(p_from date, p_to date)
returns setof tsrange
language sql
stable
set search_path = ''
as $$
  select private.sauna_event_slot(e.date, e.start_time, e.duration_minutes, e.program_id)
  from public.events e
  where e.published and e.category = 'pirtis'
    -- A smallint duration can run into the 23rd day after its start date.
    and e.date between p_from - 23 and p_to
    and private.sauna_event_slot(e.date, e.start_time, e.duration_minutes, e.program_id)
      && tsrange(p_from::timestamp, (p_to + 1)::timestamp, '[)');
$$;

create or replace function public.enforce_sauna_block_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour smallint;
begin
  if new.kind <> 'pirtis' or new.status = 'atsaukta' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('sauna:' || new.sauna_id || ':' || new.date));

  select b.hour into v_hour
  from public.sauna_blocks b
  where b.sauna_id = new.sauna_id
    and b.date = new.date
    and b.hour >= new.start_hour
    and b.hour < new.start_hour + new.hours
  order by b.hour
  limit 1;

  if found then
    raise exception 'Sauna hour %:00 on % is closed', v_hour, new.date
      using errcode = '23P01', hint = 'sauna_blocked';
  end if;

  -- A status change on an existing live slot does not reserve new time.
  if tg_op = 'UPDATE' and old.kind = 'pirtis' and old.status <> 'atsaukta'
    and (old.sauna_id, old.date, old.start_hour, old.hours)
      = (new.sauna_id, new.date, new.start_hour, new.hours) then
    return new;
  end if;

  if new.sauna_id = 'pirtis-marse' and exists (
    select 1
    from private.published_sauna_slots(new.date, new.date) as session(slot)
    where session.slot && tsrange(
      new.date + make_interval(hours => new.start_hour),
      new.date + make_interval(hours => new.start_hour + new.hours),
      '[)'
    )
  ) then
    raise exception 'Published sauna session overlaps the booking'
      using errcode = '23P01', hint = 'sauna_session';
  end if;
  return new;
end;
$$;

create or replace function public.sauna_taken(p_from date, p_to date)
returns table (sauna_id text, day date, hour smallint)
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
    select b.sauna_id, b.date, h::smallint
    from public.bookings b
    cross join lateral generate_series(b.start_hour, b.start_hour + b.hours - 1) as h
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date between p_from and p_to
    union
    select s.sauna_id, s.date, s.hour
    from public.sauna_blocks s
    where s.date between p_from and p_to
    union
    select 'pirtis-marse'::text, occupied.hour_start::date, extract(hour from occupied.hour_start)::smallint
    from private.published_sauna_slots(p_from, p_to) as session(slot)
    cross join lateral generate_series(
      greatest(date_trunc('hour', lower(session.slot)), p_from::timestamp),
      least(date_trunc('hour', upper(session.slot) - interval '1 microsecond'), p_to + interval '23 hours'),
      interval '1 hour'
    ) as occupied(hour_start)
    order by 1, 2, 3;
end;
$$;

comment on function public.sauna_taken is
  'Booked or closed hours per sauna and day, including published sauna sessions at Pirtis Marse. No customer data.';

create function private.guard_sauna_event_slot(p_slot tsrange)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_first date := lower(p_slot)::date;
  v_last date := (upper(p_slot) - interval '1 microsecond')::date;
  v_day date;
begin
  for v_day in
    select day::date from generate_series(v_first::timestamp, v_last::timestamp, interval '1 day') as day
  loop
    perform pg_advisory_xact_lock(hashtext('sauna:pirtis-marse:' || v_day));
  end loop;

  if exists (
    select 1
    from public.bookings b
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.sauna_id = 'pirtis-marse'
      and b.date between v_first and v_last
      and p_slot && tsrange(
        b.date + make_interval(hours => b.start_hour),
        b.date + make_interval(hours => b.start_hour + b.hours),
        '[)'
      )
  ) then
    raise exception 'Published sauna session overlaps an existing booking'
      using errcode = '23P01', hint = 'sauna_session';
  end if;
end;
$$;

create function private.enforce_published_sauna_event_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot tsrange;
begin
  -- Serialize publication with changes to a program that supplies its duration.
  if new.duration_minutes is null and new.program_id is not null then
    perform 1 from public.sauna_programs p where p.id = new.program_id for share;
  end if;

  v_slot := private.sauna_event_slot(new.date, new.start_time, new.duration_minutes, new.program_id);
  if tg_op = 'UPDATE' and old.published and old.category = 'pirtis'
    and v_slot <@ private.sauna_event_slot(old.date, old.start_time, old.duration_minutes, old.program_id) then
    return new;
  end if;

  perform private.guard_sauna_event_slot(v_slot);
  return new;
end;
$$;

-- AFTER checks only rows that were actually inserted or changed. In particular,
-- recurring events regenerated with ON CONFLICT DO NOTHING remain a no-op.
create trigger events_published_sauna_slot
  after insert or update of published, category, date, start_time, duration_minutes, program_id on public.events
  for each row when (new.published and new.category = 'pirtis')
  execute function private.enforce_published_sauna_event_slot();

create function private.enforce_published_sauna_program_duration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_duration integer := case when old.kind = 'session' then old.duration_minutes else 60 end;
  v_new_duration integer := case when new.kind = 'session' then new.duration_minutes else 60 end;
  v_slot tsrange;
begin
  if v_new_duration <= v_old_duration then
    return new;
  end if;

  for v_slot in
    select private.sauna_event_slot(e.date, e.start_time, e.duration_minutes, e.program_id)
    from public.events e
    where e.published and e.category = 'pirtis' and e.program_id = new.id and e.duration_minutes is null
    order by e.date, e.start_time
  loop
    perform private.guard_sauna_event_slot(v_slot);
  end loop;
  return new;
end;
$$;

create trigger sauna_programs_published_slot_duration
  after update of duration_minutes, kind on public.sauna_programs
  for each row execute function private.enforce_published_sauna_program_duration();

revoke execute on function private.sauna_event_slot(date, time, smallint, text) from public, anon, authenticated;
revoke execute on function private.published_sauna_slots(date, date) from public, anon, authenticated;
revoke execute on function private.guard_sauna_event_slot(tsrange) from public, anon, authenticated;
revoke execute on function private.enforce_published_sauna_event_slot() from public, anon, authenticated;
revoke execute on function private.enforce_published_sauna_program_duration() from public, anon, authenticated;
