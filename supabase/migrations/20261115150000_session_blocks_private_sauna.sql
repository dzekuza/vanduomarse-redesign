-- Vanduo Marse: a public sauna session blocks the private sauna while it runs and for one hour after (ADR-0091).
--
-- The booking page already hid private start times that fall inside a session. The database did not enforce it, and the
-- hour after the session (cleaning) was free to book. Now a private booking of the main sauna cannot overlap
-- [session start, session end + 60 minutes): a session 12:00-16:00 blocks 12:00-17:00, the next private start is 17:00.
--
-- A session is a published event of category 'pirtis' with a capacity (as the public site reads them); its length is the
-- event's own duration, else its program's, else 60 minutes. Only the main sauna ('pirtis-marse') hosts sessions.
-- Only a new or moved booking is checked: bookings that already exist keep working (confirming, editing the note, ...).

create function public.enforce_session_clear()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamp;
  v_end timestamp;
begin
  if new.kind <> 'pirtis' or new.status = 'atsaukta' or new.sauna_id is distinct from 'pirtis-marse' then
    return new;
  end if;
  -- An unchanged slot of a live booking (a status change, a note) is not checked again.
  if tg_op = 'UPDATE' and old.status <> 'atsaukta'
     and (old.kind, old.sauna_id, old.date, old.start_hour, old.hours) is not distinct from (new.kind, new.sauna_id, new.date, new.start_hour, new.hours) then
    return new;
  end if;

  v_start := new.date + make_interval(hours => new.start_hour::int);
  v_end := new.date + make_interval(hours => (new.start_hour + new.hours)::int);

  if exists (
    select 1
    from public.events e
    left join public.sauna_programs p on p.id = e.program_id
    where e.category = 'pirtis' and e.published and e.capacity is not null
      and (e.date + e.start_time) < v_end
      and (e.date + e.start_time + make_interval(mins => coalesce(e.duration_minutes, p.duration_minutes, 60) + 60)) > v_start
  ) then
    raise exception 'A public session runs at this time on %', new.date
      using errcode = '23P01', hint = 'session_overlap';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_session_clear() from public, anon, authenticated;

create trigger bookings_session_clear
  before insert or update of kind, sauna_id, date, start_hour, hours, status on public.bookings
  for each row execute function public.enforce_session_clear();
