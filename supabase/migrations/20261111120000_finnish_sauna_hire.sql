-- Finnish sauna landing-page tariff. Legacy callers may still use fixed programs.
alter table public.saunas add column hire_tariff jsonb;

update public.saunas
set hire_tariff = '{
  "weekday": {"2":160,"3":210,"4":240,"day":300},
  "weekend": {"2":200,"3":270,"4":320,"day":400},
  "includedGuests": 10,
  "extraGuestPrice": 15,
  "hostPrice": 250,
  "hostedProgram": "privati-pirtis-su-programa"
}'::jsonb || jsonb_build_object('unhostedProgram', coalesce((
  select p.id from public.sauna_programs p
  where p.sauna_id = saunas.id and p.active and p.kind = 'private'
    and p.id in ('privati-pirtis', 'pirtis-tik-jusu-kompanijai')
  order by (p.id = 'privati-pirtis') desc
  limit 1
), 'pirtis-tik-jusu-kompanijai'))
where id = 'pirtis-marse';

drop function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text);

create function public.create_program_booking(
  p_program_id text,
  p_date date,
  p_start_hour smallint,
  p_party smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null,
  p_hire_duration text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  pr public.sauna_programs;
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_hours smallint;
  v_total numeric;
  v_max_party integer;
  v_hosted boolean;
  v_tariff jsonb;
  v_band text;
  v_note text;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_id uuid;
  v_ref text;
begin
  select * into pr from public.sauna_programs
   where sauna_programs.id = p_program_id and sauna_programs.active and sauna_programs.kind = 'private';
  if not found then
    raise exception 'Program unavailable' using errcode = '23503', hint = 'program_unavailable';
  end if;
  select * into s from public.saunas where saunas.id = pr.sauna_id and saunas.active;
  if not found then
    raise exception 'Sauna unavailable' using errcode = '23503', hint = 'sauna_unavailable';
  end if;

  v_hours := (pr.duration_minutes / 60)::smallint;
  v_total := pr.price;
  v_max_party := least(pr.capacity, s.max_party);
  if p_hire_duration is not null then
    v_tariff := s.hire_tariff;
    v_hosted := pr.id = (v_tariff ->> 'hostedProgram');
    if v_tariff is null
      or pr.id not in (v_tariff ->> 'hostedProgram', v_tariff ->> 'unhostedProgram')
      or p_hire_duration not in ('2', '3', '4', 'day')
      or (v_hosted and p_hire_duration = '2') then
      raise exception 'Hire option unavailable' using errcode = '23514', hint = 'program_unavailable';
    end if;

    v_hours := case when p_hire_duration = 'day' then s.close_hour - s.open_hour else p_hire_duration::smallint end;
    v_band := case when extract(isodow from p_date) >= 5 then 'weekend' else 'weekday' end;
    v_max_party := s.max_party;
    v_total := (v_tariff -> v_band ->> p_hire_duration)::numeric
      + case when v_hosted then (v_tariff ->> 'hostPrice')::numeric else 0 end
      + greatest(0, p_party - (v_tariff ->> 'includedGuests')::integer) * (v_tariff ->> 'extraGuestPrice')::numeric;
  end if;
  if p_start_hour < s.open_hour or p_start_hour + v_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
  end if;
  if p_party is null or p_party < 1 or p_party > v_max_party then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'sauna_party';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'sauna_past';
  end if;

  if (select count(*) from public.bookings b
       where b.status = 'laukia' and b.source = 'svetaine' and b.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'pirtis', v_total) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  v_note := left(concat_ws(' · ', 'Programa: ' || pr.name, nullif(btrim(coalesce(p_note, '')), ''),
    case when v_code_id is not null then 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €' end), 300);

  insert into public.bookings (kind, sauna_id, program_id, customer_name, customer_email, customer_phone, date,
                               start_hour, hours, guests, total, status, source, note,
                               discount_code_id, discount_code, discount_amount)
  values ('pirtis', s.id, pr.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, v_hours, p_party, v_total - v_code_discount, 'laukia', 'svetaine', v_note,
          v_code_id, v_code_text, v_code_discount)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, v_total - v_code_discount, v_code_discount;
end;
$$;

revoke execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text, text) from public;
grant execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text, text, text) to anon, authenticated;

-- Reserve one hour between uses of the Finnish sauna.
create function private.sauna_turnaround(p_slot tsrange)
returns tsrange
language sql
immutable
set search_path = ''
as $$
  select tsrange(lower(p_slot) - interval '1 hour', upper(p_slot) + interval '1 hour', '[)');
$$;

revoke execute on function private.sauna_turnaround(tsrange) from public, anon, authenticated;

create or replace function public.enforce_sauna_block_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour smallint;
  v_slot tsrange;
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

  if new.sauna_id = 'pirtis-marse' then
    v_slot := private.sauna_turnaround(tsrange(
      new.date + make_interval(hours => new.start_hour),
      new.date + make_interval(hours => new.start_hour + new.hours),
      '[)'
    ));
    if exists (
      select 1 from private.published_sauna_slots(lower(v_slot)::date, upper(v_slot)::date) as session(slot)
      where session.slot && v_slot
    ) or exists (
      select 1 from public.bookings b
      where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.sauna_id = new.sauna_id
        and b.id is distinct from new.id and b.date = new.date
        and v_slot && tsrange(
          b.date + make_interval(hours => b.start_hour),
          b.date + make_interval(hours => b.start_hour + b.hours),
          '[)'
        )
    ) then
      raise exception 'Sauna requires one hour between bookings and sessions'
        using errcode = '23P01', hint = 'sauna_session';
    end if;
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
    cross join lateral generate_series(
      greatest(0, b.start_hour - case when b.sauna_id = 'pirtis-marse' then 1 else 0 end),
      least(23, b.start_hour + b.hours - case when b.sauna_id = 'pirtis-marse' then 0 else 1 end)
    ) as h
    where b.kind = 'pirtis' and b.status <> 'atsaukta' and b.date between p_from and p_to
    union
    select s.sauna_id, s.date, s.hour
    from public.sauna_blocks s
    where s.date between p_from and p_to
    union
    select 'pirtis-marse'::text, occupied.hour_start::date, extract(hour from occupied.hour_start)::smallint
    from private.published_sauna_slots(p_from - 1, p_to + 1) as session(slot)
    cross join lateral (select private.sauna_turnaround(session.slot) as slot) as padded
    cross join lateral generate_series(
      greatest(date_trunc('hour', lower(padded.slot)), p_from::timestamp),
      least(date_trunc('hour', upper(padded.slot) - interval '1 microsecond'), p_to + interval '23 hours'),
      interval '1 hour'
    ) as occupied(hour_start)
    order by 1, 2, 3;
end;
$$;

comment on function public.sauna_taken is
  'Booked or closed hours per sauna and day, including published sauna sessions at Pirtis Marse. No customer data.';

create function private.guard_sauna_event_slot(p_slot tsrange, p_event_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_buffered tsrange := private.sauna_turnaround(p_slot);
  v_first date := lower(v_buffered)::date;
  v_last date := (upper(v_buffered) - interval '1 microsecond')::date;
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
      and v_buffered && tsrange(
        b.date + make_interval(hours => b.start_hour),
        b.date + make_interval(hours => b.start_hour + b.hours),
        '[)'
      )
  ) then
    raise exception 'Published sauna session conflicts with a booking or its turnaround'
      using errcode = '23P01', hint = 'sauna_session';
  end if;
  if exists (
    select 1 from public.events e
    where e.published and e.category = 'pirtis' and e.id <> p_event_id
      and e.date between v_first - 23 and v_last
      and v_buffered && private.sauna_event_slot(e.date, e.start_time, e.duration_minutes, e.program_id)
  ) then
    raise exception 'Published sauna sessions require one hour between them'
      using errcode = '23P01', hint = 'sauna_session';
  end if;
end;
$$;

revoke execute on function private.guard_sauna_event_slot(tsrange, uuid) from public, anon, authenticated;

create or replace function private.enforce_published_sauna_event_slot()
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

  perform private.guard_sauna_event_slot(v_slot, new.id);
  return new;
end;
$$;

create or replace function private.enforce_published_sauna_program_duration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_duration integer := case when old.kind = 'session' then old.duration_minutes else 60 end;
  v_new_duration integer := case when new.kind = 'session' then new.duration_minutes else 60 end;
  v_event record;
begin
  if v_new_duration <= v_old_duration then
    return new;
  end if;

  for v_event in
    select e.id, private.sauna_event_slot(e.date, e.start_time, e.duration_minutes, e.program_id) as slot
    from public.events e
    where e.published and e.category = 'pirtis' and e.program_id = new.id and e.duration_minutes is null
    order by e.date, e.start_time
  loop
    perform private.guard_sauna_event_slot(v_event.slot, v_event.id);
  end loop;
  return new;
end;
$$;

drop function private.guard_sauna_event_slot(tsrange);
