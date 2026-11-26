-- An event (renginys) can take place in one event space (erdvė), like a sauna session takes place in a sauna
-- (ADR-0136). While it runs (date + start_time for duration_minutes) the space is booked: no hire
-- (space_bookings) and no other event may use the same space, or any space while either side is the whole park.
-- Both directions are checked by triggers here (security definer, so the check sees every row whatever the
-- staff member's own page permissions are); a clash raises 23P01 with hint 'space_taken'.

alter table public.events
  add column space_id text references public.spaces (id) on delete restrict;

comment on column public.events.space_id is 'Event space this event books for its duration; null = no space. Edited at /admin/erdves.';

-- A space event needs an end, so it needs a duration.
alter table public.events
  add constraint events_space_needs_duration check (space_id is null or duration_minutes is not null);

create index events_space_idx on public.events (space_id, date) where space_id is not null;

-- Staff who manage events pick the space, so they may read the space list.
drop policy "rezervacijos spaces read" on public.spaces;
create policy "rezervacijos spaces read" on public.spaces
  for select to authenticated
  using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga', 'kainos', 'renginiai'])));

-- Whether two space lists clash: a shared space, or a whole-park space on either side.
create function private.spaces_clash(a text[], b text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select a && b
    or exists (select 1 from public.spaces s where s.whole_park and (s.id = any (a) or s.id = any (b)));
$$;

-- The first booking or event that takes any of `p_spaces` between `p_from` and `p_to` (touching ends do not clash),
-- described for the error message; null when the window is free. `p_event` / `p_booking` skip the row being saved.
create function private.space_window_taken(p_spaces text[], p_from timestamp, p_to timestamp, p_event uuid, p_booking uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select format('nuoma %s %s–%s', b.date, b.start_time, b.end_time)
       from public.space_bookings b
      where b.status <> 'atsaukta'
        and b.id is distinct from p_booking
        and (b.date + b.start_time) < p_to
        and p_from < (b.end_date + b.end_time)
        and private.spaces_clash(p_spaces, b.spaces)
      limit 1),
    (select format('renginys „%s“ %s %s', e.title, e.date, e.start_time)
       from public.events e
      where e.space_id is not null
        and e.id is distinct from p_event
        and (e.date + e.start_time) < p_to
        and p_from < (e.date + e.start_time + make_interval(mins => e.duration_minutes))
        and private.spaces_clash(p_spaces, array[e.space_id])
      limit 1)
  );
$$;

create function private.check_event_space()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  taken text;
begin
  if new.space_id is null then
    return new;
  end if;
  taken := private.space_window_taken(
    array[new.space_id],
    new.date + new.start_time,
    new.date + new.start_time + make_interval(mins => new.duration_minutes),
    new.id,
    null
  );
  if taken is not null then
    raise exception 'Space % is taken: %', new.space_id, taken using errcode = '23P01', hint = 'space_taken';
  end if;
  return new;
end;
$$;

create trigger events_space_free
  before insert or update of space_id, date, start_time, duration_minutes on public.events
  for each row execute function private.check_event_space();

-- A hire must not overlap an event in the same space (hire-against-hire stays checked by the staff action).
create function private.check_space_booking_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  taken text;
begin
  if new.status = 'atsaukta' then
    return new;
  end if;
  select format('renginys „%s“ %s %s', e.title, e.date, e.start_time) into taken
    from public.events e
   where e.space_id is not null
     and (e.date + e.start_time) < (new.end_date + new.end_time)
     and (new.date + new.start_time) < (e.date + e.start_time + make_interval(mins => e.duration_minutes))
     and private.spaces_clash(new.spaces, array[e.space_id])
   limit 1;
  if taken is not null then
    raise exception 'Space taken by %', taken using errcode = '23P01', hint = 'space_taken';
  end if;
  return new;
end;
$$;

create trigger space_bookings_events_free
  before insert or update of spaces, date, end_date, start_time, end_time, status on public.space_bookings
  for each row execute function private.check_space_booking_events();

revoke execute on function private.spaces_clash(text[], text[]) from public, anon;
revoke execute on function private.space_window_taken(text[], timestamp, timestamp, uuid, uuid) from public, anon;
revoke execute on function private.check_event_space() from public, anon;
revoke execute on function private.check_space_booking_events() from public, anon;
