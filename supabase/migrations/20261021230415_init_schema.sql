-- Vanduo Marse: core schema.
-- Mirrors lib/admin/types.ts, lib/sauna.ts, lib/sauna-upsells.ts, lib/cabin.ts
-- and lib/sauna-events.ts (snake_case here, camelCase in the app).
-- Enum labels match the TypeScript unions exactly so rows map without lookups.
-- Dates are local park days (Europe/Vilnius) stored as `date`; money is
-- numeric(10,2) EUR incl. 21% PVM.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.booking_kind as enum ('pirtis', 'namelis', 'kemperis');
create type public.booking_source as enum ('svetaine', 'telefonu', 'vietoje');
create type public.booking_status as enum ('laukia', 'patvirtinta', 'ivykdyta', 'atsaukta');
create type public.inquiry_status as enum ('nauja', 'susisiekta', 'pasiulymas', 'laimeta', 'prarasta');
create type public.inquiry_source as enum ('skaiciuokle', 'renginys', 'kontaktai');
create type public.event_category as enum ('pirtis', 'vakarai', 'akademija', 'sventes');
create type public.upsell_unit as enum ('rezervacijai', 'asmeniui', 'vienetui', 'valandai');
create type public.price_group as enum ('Erdvės', 'Maitinimas', 'Paslaugos', 'Pramogos', 'Nakvynė');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff (dashboard users). Rows are added by hand / service role only.
-- ---------------------------------------------------------------------------

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

comment on table public.staff is 'Users allowed into /admin. Membership is the only admin check (see public.is_staff()).';

-- ---------------------------------------------------------------------------
-- Sauna settings: single row, = SaunaRates
-- ---------------------------------------------------------------------------

create table public.sauna_settings (
  id boolean primary key default true check (id),
  small_group_max smallint not null check (small_group_max between 1 and 50),
  small_group_rate numeric(10, 2) not null check (small_group_rate between 0 and 100000),
  large_group_rate numeric(10, 2) not null check (large_group_rate between 0 and 100000),
  max_party smallint not null check (max_party between 1 and 100),
  min_hours smallint not null check (min_hours between 1 and 12),
  max_hours smallint not null check (max_hours between 1 and 12),
  package_hours smallint not null check (package_hours between 1 and 12),
  package_price numeric(10, 2) not null check (package_price between 0 and 100000),
  open_hour smallint not null check (open_hour between 0 and 23),
  close_hour smallint not null check (close_hour between 1 and 24),
  updated_at timestamptz not null default now(),
  -- Same cross-field rules as components/admin/sauna/rates-schema.ts
  constraint sauna_settings_party check (max_party > small_group_max),
  constraint sauna_settings_hours check (min_hours <= max_hours),
  constraint sauna_settings_package check (package_hours between min_hours and max_hours),
  constraint sauna_settings_opening check (close_hour - open_hour >= min_hours)
);

comment on table public.sauna_settings is 'Singleton (id = true). Private sauna pricing and booking limits; edited in /admin/pirtis.';

create trigger sauna_settings_updated_at before update on public.sauna_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sauna upsells (extras on a private booking)
-- ---------------------------------------------------------------------------

create table public.sauna_upsells (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null check (length(trim(name)) between 1 and 80),
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  unit public.upsell_unit not null,
  -- For `vienetui`: max items, null = up to the group size. Other units are on/off.
  max_qty smallint check (max_qty is null or max_qty > 0),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sauna_upsells_updated_at before update on public.sauna_upsells
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stay types: cabin sizes and camper pitches (lib/cabin.ts)
-- ---------------------------------------------------------------------------

create table public.stay_types (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  kind public.booking_kind not null check (kind <> 'pirtis'),
  label text not null,
  note text not null default '',
  max_guests smallint not null check (max_guests > 0),
  price_per_night numeric(10, 2) not null check (price_per_night >= 0),
  -- How many of this type exist; null = not limited (camper pitches).
  units smallint check (units is null or units > 0),
  active boolean not null default true,
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now(),
  -- Lets bookings reference (id, kind) so a cabin booking can't point at a pitch.
  unique (id, kind)
);

create trigger stay_types_updated_at before update on public.stay_types
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bookings: private sauna sessions and stays
-- ---------------------------------------------------------------------------

create sequence public.booking_reference_pm_seq start 1001; -- sauna, "PM-1001"
create sequence public.booking_reference_mm_seq start 1001; -- stays, "MM-1001"

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  kind public.booking_kind not null,
  customer_name text not null check (length(trim(customer_name)) >= 2),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text,
  date date not null,
  -- Sauna only
  start_hour smallint check (start_hour between 0 and 23),
  hours smallint check (hours between 1 and 24),
  -- Stays only
  nights smallint check (nights between 1 and 60),
  stay_type_id text,
  guests smallint not null check (guests >= 1),
  total numeric(10, 2) not null check (total >= 0),
  status public.booking_status not null default 'laukia',
  source public.booking_source not null default 'svetaine',
  note text check (note is null or length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_contact check (customer_email is not null or customer_phone is not null),
  constraint bookings_shape check (
    (kind = 'pirtis'
      and start_hour is not null and hours is not null and start_hour + hours <= 24
      and nights is null and stay_type_id is null)
    or
    (kind <> 'pirtis'
      and nights is not null and stay_type_id is not null
      and start_hour is null and hours is null)
  ),
  constraint bookings_stay_type_fk foreign key (stay_type_id, kind)
    references public.stay_types (id, kind) on update cascade on delete restrict,
  -- No two live sauna sessions may overlap.
  constraint bookings_no_sauna_overlap exclude using gist (
    date with =,
    int4range(start_hour, start_hour + hours) with &&
  ) where (kind = 'pirtis' and status <> 'atsaukta')
);

comment on column public.bookings.total is 'What the customer pays, EUR incl. PVM. Computed by the app (or overridden by staff), stored as charged.';

create index bookings_date_idx on public.bookings (date);
create index bookings_kind_date_idx on public.bookings (kind, date);
create index bookings_stay_type_idx on public.bookings (stay_type_id, date) where stay_type_id is not null;
create index bookings_status_idx on public.bookings (status);
create index bookings_created_at_idx on public.bookings (created_at desc);

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- Extras sold with a booking. Name, unit and price are snapshots, so editing or
-- deleting an upsell later never rewrites what a customer was charged.
create table public.booking_extras (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  upsell_id text references public.sauna_upsells (id) on update cascade on delete set null,
  name text not null,
  unit public.upsell_unit not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity smallint not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index booking_extras_booking_idx on public.booking_extras (booking_id);
create index booking_extras_upsell_idx on public.booking_extras (upsell_id);

-- ---------------------------------------------------------------------------
-- Sauna blocks: hours closed by staff
-- ---------------------------------------------------------------------------

create table public.sauna_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  hour smallint not null check (hour between 0 and 23),
  reason text not null default 'Uždaryta',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (date, hour)
);

create index sauna_blocks_created_by_idx on public.sauna_blocks (created_by);

-- ---------------------------------------------------------------------------
-- Event inquiries (calculator, event registration, contact form)
-- ---------------------------------------------------------------------------

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(trim(customer_name)) >= 2),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text,
  source public.inquiry_source not null,
  event_type text not null,
  date date,
  guests integer not null check (guests >= 1),
  space text not null default '',
  estimate_min numeric(10, 2),
  estimate_max numeric(10, 2),
  -- The calculator's EstimateInput, so staff can reopen the exact quote.
  calculator_input jsonb,
  message text not null default '' check (length(message) <= 2000),
  status public.inquiry_status not null default 'nauja',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_contact check (customer_email is not null or customer_phone is not null),
  constraint inquiries_estimate check (
    (estimate_min is null and estimate_max is null)
    or (estimate_min is not null and estimate_max is not null and 0 <= estimate_min and estimate_min <= estimate_max)
  )
);

create index inquiries_status_idx on public.inquiries (status);
create index inquiries_created_at_idx on public.inquiries (created_at desc);

create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

create table public.inquiry_notes (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  text text not null check (length(trim(text)) between 1 and 2000),
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at);
create index inquiry_notes_author_idx on public.inquiry_notes (author_id);

-- ---------------------------------------------------------------------------
-- Events: park events and public sauna sessions
-- ---------------------------------------------------------------------------

-- Recurring public sauna sessions (lib/sauna-events.ts). Materialised into
-- `events` by public.materialize_sauna_events().
create table public.sauna_event_templates (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  title text not null,
  host text not null,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  duration_minutes smallint not null check (duration_minutes > 0),
  price_per_person numeric(10, 2) not null check (price_per_person >= 0),
  capacity smallint not null check (capacity > 0),
  blurb text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger sauna_event_templates_updated_at before update on public.sauna_event_templates
  for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 80),
  category public.event_category not null,
  date date not null,
  start_time time not null,
  duration_minutes smallint check (duration_minutes is null or duration_minutes > 0),
  place text not null check (length(trim(place)) between 2 and 80),
  blurb text not null check (length(blurb) <= 240),
  price numeric(10, 2) check (price is null or price >= 0),          -- null = free entry
  capacity integer check (capacity is null or capacity >= 0),        -- null = no ticket limit
  sold integer not null default 0 check (sold >= 0),                 -- maintained from event_tickets
  published boolean not null default false,
  template_id text references public.sauna_event_templates (id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, date)
);

create index events_date_idx on public.events (date, start_time);
create index events_published_date_idx on public.events (date) where published;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create sequence public.ticket_reference_seq start 1001; -- "PR-1001"

create table public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  event_id uuid not null references public.events (id) on delete restrict,
  customer_name text not null check (length(trim(customer_name)) >= 2),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text,
  people smallint not null check (people >= 1),
  total numeric(10, 2) not null check (total >= 0),
  status public.booking_status not null default 'patvirtinta',
  source public.booking_source not null default 'svetaine',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_tickets_contact check (customer_email is not null or customer_phone is not null)
);

create index event_tickets_event_idx on public.event_tickets (event_id);

create trigger event_tickets_updated_at before update on public.event_tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Price list (/admin/kainos)
-- ---------------------------------------------------------------------------

create table public.price_items (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  "group" public.price_group not null,
  label text not null,
  unit text not null,
  value numeric(10, 2) not null check (value >= 0),
  max numeric(10, 2),                       -- upper bound when the sheet gives a range
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now(),
  constraint price_items_range check (max is null or max >= value)
);

create index price_items_group_idx on public.price_items ("group", sort_order);

create trigger price_items_updated_at before update on public.price_items
  for each row execute function public.set_updated_at();
