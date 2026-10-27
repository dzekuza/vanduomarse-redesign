-- Vanduo Marse: quad (keturratis) rental.
--
-- Two ways to ride:
--   * hourly rental from a fleet: quad_types (fleet) + quad_rentals, with a
--     capacity trigger that never lets a type go over its units in any hour;
--   * guided tours: events with category 'keturratis' + event_tickets.
--
-- Anon never reads rentals or tickets. It can read the fleet, see how many
-- quads are taken per hour (no customer data) and file a request through
-- security definer functions. Staff confirm or reject in /admin/keturraciai.

-- ---------------------------------------------------------------------------
-- Fleet and settings
-- ---------------------------------------------------------------------------

create table public.quad_types (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  seats smallint not null check (seats between 1 and 2),
  units smallint not null check (units >= 0),
  price_per_hour numeric(10, 2) not null check (price_per_hour >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quad_types_updated_at before update on public.quad_types
  for each row execute function public.set_updated_at();

-- Singleton row (id = true), like sauna_settings.
create table public.quad_settings (
  id boolean primary key default true check (id),
  open_hour smallint not null check (open_hour between 0 and 23),
  close_hour smallint not null check (close_hour between 1 and 24),
  max_hours smallint not null check (max_hours between 1 and 8),
  /** Refundable deposit in EUR; 0 hides it on the public page. */
  deposit numeric(10, 2) not null default 0 check (deposit >= 0),
  min_age smallint not null check (min_age between 10 and 99),
  /** Free-text rules shown on the public page; empty hides the block. */
  rules text not null default '' check (char_length(rules) <= 800),
  updated_at timestamptz not null default now(),
  constraint quad_settings_hours check (close_hour > open_hour)
);

create trigger quad_settings_updated_at before update on public.quad_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rentals
-- ---------------------------------------------------------------------------

create sequence public.quad_rental_reference_seq start 1001; -- "KT-1001"
create sequence public.tour_ticket_reference_seq start 1001; -- "KZ-1001"

create table public.quad_rentals (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  quad_type_id text not null references public.quad_types (id) on update cascade on delete restrict,
  date date not null,
  start_hour smallint not null check (start_hour between 0 and 23),
  hours smallint not null check (hours between 1 and 8),
  units smallint not null check (units between 1 and 20),
  riders smallint not null check (riders >= 1),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 80),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 30),
  total numeric(10, 2) not null check (total >= 0),
  status public.booking_status not null default 'laukia',
  source public.booking_source not null default 'svetaine',
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quad_rentals_within_day check (start_hour + hours <= 24),
  constraint quad_rentals_contact check (customer_email is not null or customer_phone is not null)
);

create index quad_rentals_type_date_idx on public.quad_rentals (quad_type_id, date);
create index quad_rentals_status_idx on public.quad_rentals (status, date);

create trigger quad_rentals_updated_at before update on public.quad_rentals
  for each row execute function public.set_updated_at();

create function public.set_quad_rental_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := 'KT-' || nextval('public.quad_rental_reference_seq');
  end if;
  return new;
end;
$$;

create trigger quad_rentals_reference before insert on public.quad_rentals
  for each row execute function public.set_quad_rental_reference();

-- A type never goes over its units in any hour of the rental. Cancelled rows
-- block nothing. The advisory lock serialises concurrent requests per type.
create function public.enforce_quad_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_units smallint;
  v_full integer;
begin
  if new.status = 'atsaukta' then
    return new;
  end if;

  select t.units into v_units from public.quad_types t where t.id = new.quad_type_id;
  if new.units > coalesce(v_units, 0) then
    raise exception 'Only % of % exist', coalesce(v_units, 0), new.quad_type_id
      using errcode = '23P01', hint = 'quad_full';
  end if;

  perform pg_advisory_xact_lock(hashtext('quad:' || new.quad_type_id));

  select h into v_full
  from generate_series(new.start_hour, new.start_hour + new.hours - 1) as h
  where (
    select coalesce(sum(r.units), 0)
    from public.quad_rentals r
    where r.quad_type_id = new.quad_type_id
      and r.date = new.date
      and r.status <> 'atsaukta'
      and r.id <> new.id
      and r.start_hour <= h
      and h < r.start_hour + r.hours
  ) + new.units > v_units
  order by h
  limit 1;

  if found then
    raise exception 'Not enough % free at %:00 on %', new.quad_type_id, v_full, new.date
      using errcode = '23P01', hint = 'quad_full';
  end if;
  return new;
end;
$$;

create trigger quad_rentals_capacity before insert or update of quad_type_id, date, start_hour, hours, units, status
  on public.quad_rentals
  for each row execute function public.enforce_quad_capacity();

-- ---------------------------------------------------------------------------
-- Public functions (security definer)
-- ---------------------------------------------------------------------------

-- Quads taken per type and hour: counts only, no customer data.
create function public.quad_taken(p_from date, p_to date)
returns table (day date, hour smallint, quad_type_id text, taken integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 60 then
    raise exception 'Range must be 0-60 days' using errcode = '22023';
  end if;

  return query
    select r.date, h::smallint, r.quad_type_id, sum(r.units)::integer
    from public.quad_rentals r
    cross join lateral generate_series(r.start_hour, r.start_hour + r.hours - 1) as h
    where r.status <> 'atsaukta' and r.date between p_from and p_to
    group by r.date, h, r.quad_type_id
    order by r.date, h;
end;
$$;

-- Public rental request. Price, hours and rider limits come from the fleet and
-- settings rows, never from the caller. Lands as 'laukia' for staff to confirm.
create function public.create_quad_rental(
  p_type_id text,
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_units smallint,
  p_riders smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.quad_types;
  s public.quad_settings;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
begin
  select * into t from public.quad_types where quad_types.id = p_type_id and active;
  if not found then
    raise exception 'Quad type unavailable' using errcode = '23503', hint = 'quad_unavailable';
  end if;
  select * into s from public.quad_settings;

  if p_hours < 1 or p_hours > s.max_hours or p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'quad_closed';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'quad_past';
  end if;
  if p_units < 1 or p_riders < 1 or p_riders > p_units * t.seats then
    raise exception 'Too many riders for the chosen quads' using errcode = '23514', hint = 'quad_riders';
  end if;

  if (select count(*) from public.quad_rentals r
       where r.status = 'laukia' and r.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  return query
  insert into public.quad_rentals (quad_type_id, date, start_hour, hours, units, riders,
                                   customer_name, customer_email, customer_phone, total, note)
  values (t.id, p_date, p_start_hour, p_hours, p_units, p_riders,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_hours * p_units * t.price_per_hour, nullif(btrim(coalesce(p_note, '')), ''))
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total;
end;
$$;

-- Public tour ticket request: only for published quad tours with seats left.
create function public.create_tour_ticket(
  p_event_id uuid,
  p_people smallint,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
begin
  select * into e from public.events
   where events.id = p_event_id and category = 'keturratis' and published and capacity is not null
     and date >= (now() at time zone 'Europe/Vilnius')::date;
  if not found then
    raise exception 'Tour unavailable' using errcode = '23503', hint = 'tour_unavailable';
  end if;
  if p_people < 1 or p_people > 20 then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'tour_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  return query
  insert into public.event_tickets (reference, event_id, customer_name, customer_email, customer_phone,
                                    people, total, status, source)
  values ('KZ-' || nextval('public.tour_ticket_reference_seq'), e.id, btrim(p_name),
          nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_people, p_people * coalesce(e.price, 0), 'laukia', 'svetaine')
  returning event_tickets.id, event_tickets.reference, event_tickets.total;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

alter table public.quad_types enable row level security;
alter table public.quad_settings enable row level security;
alter table public.quad_rentals enable row level security;

revoke all on public.quad_rentals from anon;
revoke all on sequence public.quad_rental_reference_seq, public.tour_ticket_reference_seq from anon;

-- quad_types: anon sees active ones; staff also sees inactive ones.
create policy "anon read active quad types" on public.quad_types
  for select to anon using (active);
create policy "authenticated read quad types" on public.quad_types
  for select to authenticated using (active or (select private.is_staff()));
create policy "staff insert quad types" on public.quad_types
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff update quad types" on public.quad_types
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff delete quad types" on public.quad_types
  for delete to authenticated using ((select private.is_staff()));

-- quad_settings: public read, staff update.
create policy "public read quad settings" on public.quad_settings
  for select to anon, authenticated using (true);
create policy "staff update quad settings" on public.quad_settings
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "staff manage quad rentals" on public.quad_rentals
  for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

revoke execute on function public.set_quad_rental_reference() from public, anon, authenticated;
revoke execute on function public.enforce_quad_capacity() from public, anon, authenticated;

revoke execute on function public.quad_taken(date, date) from public;
grant execute on function public.quad_taken(date, date) to anon, authenticated;

revoke execute on function public.create_quad_rental(text, date, smallint, smallint, smallint, smallint, text, text, text, text) from public;
grant execute on function public.create_quad_rental(text, date, smallint, smallint, smallint, smallint, text, text, text, text) to anon, authenticated;

revoke execute on function public.create_tour_ticket(uuid, smallint, text, text, text) from public;
grant execute on function public.create_tour_ticket(uuid, smallint, text, text, text) to anon, authenticated;
