-- Vanduo Marse: staff-entered bookings of the event spaces (erdvės): terrace, dome, "Corona", restaurant, whole park.
--
-- One row is one hire: a day and time window, one or more spaces taken together, the customer (name, surname, phone)
-- and the agreed price. `spaces` holds the SpaceId values of lib/event-pricing.ts; the price is whatever staff agreed
-- (the sheet only suggests it). Clashes (the same space on an overlapping time) are checked by the staff action.
-- Read by Rezervacijos / Užimtumas / Apžvalga staff, written by Rezervacijos.

create table public.space_bookings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  spaces text[] not null,
  customer_name text not null check (length(trim(customer_name)) >= 2),
  customer_surname text not null default '' check (length(customer_surname) <= 80),
  customer_phone text not null check (length(trim(customer_phone)) >= 6),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guests integer not null default 1 check (guests >= 1),
  price numeric(10, 2) not null default 0 check (price >= 0),
  status public.booking_status not null default 'patvirtinta',
  note text not null default '' check (length(note) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint space_bookings_times check (end_time > start_time),
  constraint space_bookings_spaces check (
    cardinality(spaces) >= 1
    and spaces <@ array['terasa', 'kupolas-svente', 'kupolas-seminaras', 'kupolas-corona', 'corona', 'restoranas', 'parkas', 'parkas-wake']
  )
);

comment on table public.space_bookings is 'Staff-entered hires of the event spaces (one or several together) with the customer and agreed price.';

create index space_bookings_date_idx on public.space_bookings (date);
create index space_bookings_created_by_idx on public.space_bookings (created_by);

create trigger space_bookings_updated_at before update on public.space_bookings
  for each row execute function public.set_updated_at();

alter table public.space_bookings enable row level security;

create policy "rezervacijos space bookings read" on public.space_bookings
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga'])));

create policy "rezervacijos space bookings insert" on public.space_bookings
  for insert to authenticated with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos space bookings update" on public.space_bookings
  for update to authenticated using ((select private.has_permission('rezervacijos'))) with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos space bookings delete" on public.space_bookings
  for delete to authenticated using ((select private.has_permission('rezervacijos')));
