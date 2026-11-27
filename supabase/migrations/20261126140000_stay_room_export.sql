-- Outbound room calendars for Sirvoy (ADR-0130): our confirmed cabin bookings, per Sirvoy room, as iCal.
--
-- Sirvoy imports a feed per ROOM, while our bookings take "one of the type's units". So each confirmed website or
-- staff booking unit is given one room (an external_calendars row of its stay type) and kept there, so it never jumps
-- between rooms (Sirvoy cancels an imported booking whose room changes). A room is picked only when it has no Sirvoy
-- block and no other of our bookings on those nights; a unit with no free room is left out of the feed (an overbooking
-- staff already see on the calendar).
--
-- Echo: once Sirvoy has imported our booking into room X, room X's Sirvoy export contains it too and the sync stores it
-- as an external block. external_units_on() therefore ignores blocks of a room on nights that room is assigned to one
-- of our bookings: that room is counted once, through the booking. With no assignments the function returns exactly
-- what it did before, so this migration changes nothing until a feed is first read.
--
-- Additive: two new tables (RLS on, no policies: service role only), one new function, external_units_on re-created.

create table public.stay_room_assignments (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  unit smallint not null check (unit >= 1),
  calendar_id uuid not null references public.external_calendars (id) on delete cascade,
  -- The dates exported; a booking moved to other dates is re-assigned.
  starts_on date not null,
  nights smallint not null check (nights >= 1),
  created_at timestamptz not null default now(),
  primary key (booking_id, unit)
);

comment on table public.stay_room_assignments is 'Which Sirvoy room (external_calendars) each unit of a confirmed cabin booking is exported to. Written only by assign_stay_rooms().';

create index stay_room_assignments_room_idx on public.stay_room_assignments (calendar_id, starts_on);

alter table public.stay_room_assignments enable row level security;

-- The secret part of each room's export address. Never sent to the browser except to the owner, by a server action.
create table public.external_calendar_exports (
  calendar_id uuid primary key references public.external_calendars (id) on delete cascade,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  created_at timestamptz not null default now()
);

comment on table public.external_calendar_exports is 'Secret token of each room''s outbound iCal feed (/api/ical/room/<token>). Service role only.';

alter table public.external_calendar_exports enable row level security;

insert into public.external_calendar_exports (calendar_id) select id from public.external_calendars;

-- A new room row gets its token at once.
create function private.add_external_calendar_export()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.external_calendar_exports (calendar_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger external_calendars_export_token
  after insert on public.external_calendars
  for each row execute function private.add_external_calendar_export();

-- Gives every exportable booking unit a room. Idempotent; runs before a feed is served.
create function public.assign_stay_rooms()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  u integer;
  v_room uuid;
  v_added integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('assign_stay_rooms'));

  -- Drop what no longer applies: cancelled or pending booking, past stay, moved dates, other type, room off, fewer units.
  delete from public.stay_room_assignments a
  using public.bookings k, public.external_calendars c
  where k.id = a.booking_id and c.id = a.calendar_id
    and (
      k.status not in ('patvirtinta', 'ivykdyta')
      or k.date + k.nights < current_date
      or a.starts_on <> k.date or a.nights <> k.nights
      or c.stay_type_id is distinct from k.stay_type_id
      or not c.active
      or a.unit > k.stay_units
    );

  for b in
    select k.id, k.date, k.nights, k.stay_type_id, k.stay_units
    from public.bookings k
    where k.status in ('patvirtinta', 'ivykdyta')
      and k.stay_type_id is not null
      and k.date + k.nights >= current_date
      and exists (select 1 from public.external_calendars c where c.stay_type_id = k.stay_type_id and c.active)
      and (select count(*) from public.stay_room_assignments a where a.booking_id = k.id) < k.stay_units
    order by k.created_at, k.id
  loop
    for u in 1 .. b.stay_units loop
      continue when exists (select 1 from public.stay_room_assignments a where a.booking_id = b.id and a.unit = u);
      select c.id into v_room
      from public.external_calendars c
      where c.stay_type_id = b.stay_type_id
        and c.active
        and not exists (
          select 1 from public.stay_room_assignments a
          where a.calendar_id = c.id and a.starts_on < b.date + b.nights and b.date < a.starts_on + a.nights
        )
        and not exists (
          select 1 from public.external_blocks x
          where x.calendar_id = c.id and x.starts_on < b.date + b.nights and b.date < x.starts_on + x.nights
        )
      order by case when c.label ~ '^\d+$' then c.label::integer end nulls last, c.label, c.id
      limit 1;
      if v_room is not null then
        insert into public.stay_room_assignments (booking_id, unit, calendar_id, starts_on, nights)
        values (b.id, u, v_room, b.date, b.nights);
        v_added := v_added + 1;
      end if;
    end loop;
  end loop;

  return v_added;
end;
$$;

comment on function public.assign_stay_rooms is 'Service role: assigns each confirmed cabin booking unit to a free Sirvoy room for the outbound iCal feed.';

revoke all on function public.assign_stay_rooms() from public, anon, authenticated;
grant execute on function public.assign_stay_rooms() to service_role;

-- Sirvoy blocks count as stock, except a room's block on a night that room already holds one of our bookings
-- (the echo of our own export, or a clash already shown to staff): that room is counted through the booking.
create or replace function private.external_units_on(p_stay_type text, p_day date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct b.calendar_id)::integer
  from public.external_blocks b
  join public.external_calendars c on c.id = b.calendar_id
  where c.stay_type_id = p_stay_type
    and c.active
    and b.starts_on <= p_day
    and p_day < b.starts_on + b.nights
    and not exists (
      select 1
      from public.stay_room_assignments a
      join public.bookings k on k.id = a.booking_id
      where a.calendar_id = b.calendar_id
        and k.status in ('patvirtinta', 'ivykdyta')
        and a.starts_on = k.date and a.nights = k.nights
        and a.starts_on <= p_day and p_day < a.starts_on + a.nights
    );
$$;
