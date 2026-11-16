-- Vanduo Marse: reservations made on Booking.com (and any other Sirvoy source) block our cabins.
--
-- The property's Booking.com inventory is run by Sirvoy (XML connection). Sirvoy has no open API but
-- exports one iCal availability feed per room. Each of the 14 rooms is one `external_calendars` row
-- (label = the Sirvoy room number) mapped to a stay type; the cron route reads its feed and keeps that
-- room's reservations in `external_blocks`. A block takes the room for each night it covers, so one
-- room is at most one unit per night however many events its feed holds.
--
-- Blocks count in stay_occupancy() (the public availability) and in the stay capacity trigger (staff
-- and website bookings), so a night Sirvoy has sold can no longer be booked here. One way only: nothing
-- is sent back to Sirvoy. The sync itself never fails on a clash (an overbooking is a fact to show).
--
-- The feed URLs are secrets (anyone holding one can read that room's dates), so they live in a table
-- with row level security and no policy; only the owner function below and the service-role sync
-- functions touch it. The browser never receives a URL.

create table public.external_calendars (
  id uuid primary key default gen_random_uuid(),
  stay_type_id text not null references public.stay_types (id) on update cascade on delete restrict,
  label text not null unique check (btrim(label) <> ''),
  -- Switched on by set_external_feed when a URL is stored.
  active boolean not null default false,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

comment on table public.external_calendars is 'One Sirvoy room feed (label = Sirvoy room number) mapped to the stay type it occupies. Read by staff; written only through set_external_feed and the sync functions.';

create table public.external_calendar_feeds (
  calendar_id uuid primary key references public.external_calendars (id) on delete cascade,
  feed_url text not null check (feed_url ~ '^https://secured\.sirvoy\.com/ical/[A-Za-z0-9-]{8,64}/?$')
);

comment on table public.external_calendar_feeds is 'Secret iCal export URLs. RLS on, no policies: reachable only through security definer functions.';

create table public.external_blocks (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.external_calendars (id) on delete cascade,
  uid text not null check (btrim(uid) <> ''),
  starts_on date not null,
  nights smallint not null check (nights between 1 and 400),
  constraint external_blocks_uid unique (calendar_id, uid)
);

create index external_blocks_day_idx on public.external_blocks (calendar_id, starts_on);

comment on table public.external_blocks is 'One reservation or closure from a Sirvoy room feed: the room is taken from starts_on for nights nights (check-out day free). Replaced wholesale by the sync.';

alter table public.external_calendars enable row level security;
alter table public.external_calendar_feeds enable row level security;
alter table public.external_blocks enable row level security;

create policy "stays staff read external calendars" on public.external_calendars
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga'])));

create policy "stays staff read external blocks" on public.external_blocks
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga'])));

-- The 14 rooms. Sirvoy "Double" (2 guests) = rooms 1-4 and 11-14; "Quadruple" (4 guests) = rooms 5-10.
insert into public.external_calendars (stay_type_id, label)
select case when n between 5 and 10 then 'namelis-4' else 'namelis-2' end, n::text
from generate_series(1, 14) as n
on conflict (label) do nothing;

-- Units a stay type has taken on a night through external blocks (distinct rooms, so overlapping
-- events in one room's feed never count twice).
create function private.external_units_on(p_stay_type text, p_day date)
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
    and p_day < b.starts_on + b.nights;
$$;

revoke execute on function private.external_units_on(text, date) from public, anon;

-- Public availability: bookings plus Sirvoy rooms.
create or replace function public.stay_occupancy(p_from date, p_to date)
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
    select d::date, t.id,
      (
        coalesce((
          select sum(b.stay_units)
          from public.bookings b
          where b.stay_type_id = t.id
            and b.status <> 'atsaukta'
            and b.date <= d::date
            and d::date < b.date + b.nights
        ), 0)
        + private.external_units_on(t.id, d::date)
      )::integer,
      t.units
    from generate_series(p_from, p_to, interval '1 day') as d
    cross join public.stay_types t
    where t.active
    order by d, t.sort_order;
end;
$$;

comment on function public.stay_occupancy is 'Reserved units per stay type per night: bookings plus Sirvoy room blocks (stock units null = unlimited).';

-- Staff and website bookings must leave the Sirvoy rooms alone too.
create or replace function public.enforce_stay_capacity()
returns trigger
language plpgsql
security definer
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
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('stay:' || new.stay_type_id));

  select night::date into v_full
  from generate_series(new.date, new.date + new.nights - 1, interval '1 day') as night
  where (
    select coalesce(sum(b.stay_units), 0)
    from public.bookings b
    where b.stay_type_id = new.stay_type_id
      and b.status <> 'atsaukta'
      and b.id <> new.id
      and b.date <= night::date
      and night::date < b.date + b.nights
  ) + private.external_units_on(new.stay_type_id, night::date) + new.stay_units > v_units
  order by night
  limit 1;

  if found then
    raise exception 'Not enough % left for the night of %', new.stay_type_id, v_full
      using errcode = '23P01', hint = 'stay_full';
  end if;
  return new;
end;
$$;

-- Owner: store (or clear) one room's feed URL. Only the Sirvoy export host is accepted, because the server fetches it.
create function public.set_external_feed(p_calendar uuid, p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text := nullif(btrim(coalesce(p_url, '')), '');
begin
  if not (select private.is_owner()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.external_calendars where id = p_calendar) then
    raise exception 'Unknown calendar' using errcode = '23503', hint = 'calendar_missing';
  end if;

  if v_url is null then
    delete from public.external_calendar_feeds where calendar_id = p_calendar;
    delete from public.external_blocks where calendar_id = p_calendar;
    update public.external_calendars set active = false, last_synced_at = null, last_error = null where id = p_calendar;
    return;
  end if;

  if v_url !~ '^https://secured\.sirvoy\.com/ical/[A-Za-z0-9-]{8,64}/?$' then
    raise exception 'Not a Sirvoy iCal export URL' using errcode = '23514', hint = 'feed_url';
  end if;

  insert into public.external_calendar_feeds (calendar_id, feed_url) values (p_calendar, v_url)
  on conflict (calendar_id) do update set feed_url = excluded.feed_url;
  update public.external_calendars set active = true, last_error = null where id = p_calendar;
end;
$$;

-- Sync (service role only, called by the cron route): which feeds to read.
create function public.external_sync_feeds()
returns table (calendar_id uuid, feed_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, f.feed_url
  from public.external_calendars c
  join public.external_calendar_feeds f on f.calendar_id = c.id
  where c.active
  order by c.label;
$$;

-- Replace one room's blocks with what its feed lists, in one transaction. p_blocks: [{uid, starts_on, nights}].
create function public.sync_external_blocks(p_calendar uuid, p_blocks jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if jsonb_typeof(p_blocks) <> 'array' or jsonb_array_length(p_blocks) > 3000 then
    raise exception 'Invalid block list' using errcode = '22023';
  end if;
  if not exists (select 1 from public.external_calendars where id = p_calendar and active) then
    raise exception 'Unknown calendar' using errcode = '23503', hint = 'calendar_missing';
  end if;

  delete from public.external_blocks b
  where b.calendar_id = p_calendar
    and not exists (
      select 1 from jsonb_to_recordset(p_blocks) as x (uid text, starts_on date, nights integer) where x.uid = b.uid
    );

  insert into public.external_blocks (calendar_id, uid, starts_on, nights)
  select p_calendar, x.uid, x.starts_on, x.nights::smallint
  from jsonb_to_recordset(p_blocks) as x (uid text, starts_on date, nights integer)
  on conflict (calendar_id, uid) do update set starts_on = excluded.starts_on, nights = excluded.nights;

  v_count := jsonb_array_length(p_blocks);
  update public.external_calendars set last_synced_at = now(), last_error = null where id = p_calendar;
  return v_count;
end;
$$;

-- A failed read keeps the old blocks and records why.
create function public.external_sync_failed(p_calendar uuid, p_error text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.external_calendars set last_error = left(coalesce(p_error, 'Unknown error'), 300) where id = p_calendar;
$$;

revoke execute on function public.set_external_feed(uuid, text) from public, anon;
grant execute on function public.set_external_feed(uuid, text) to authenticated;

revoke execute on function public.external_sync_feeds() from public, anon, authenticated;
revoke execute on function public.sync_external_blocks(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.external_sync_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.external_sync_feeds() to service_role;
grant execute on function public.sync_external_blocks(uuid, jsonb) to service_role;
grant execute on function public.external_sync_failed(uuid, text) to service_role;
