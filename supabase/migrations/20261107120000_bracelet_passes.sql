-- Vanduo Marse: bracelet pass scanning (ADR-0038).
--
-- Riders carry a ride plan and, optionally, a physical bracelet (a USB IC/RFID
-- reader's factory UID) bound to them. Staff with the `apyrankes` permission
-- scan a bracelet to resolve it to a rider + plan, or sell a plan to an
-- existing rider / new guest and bind their bracelet. Entirely a staff tool:
-- anon never reads or writes any of these three tables.

create table public.ride_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  -- EUR incl. 21% PVM; null = no charge (e.g. staff).
  price numeric(10, 2) check (price is null or price >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ride_plans_updated_at before update on public.ride_plans
  for each row execute function public.set_updated_at();

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  surname text not null check (char_length(surname) between 1 and 60),
  plan_id uuid not null references public.ride_plans(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index riders_plan_id_idx on public.riders(plan_id);

create trigger riders_updated_at before update on public.riders
  for each row execute function public.set_updated_at();

-- One bracelet UID -> one rider. Rebinding a UID to a different rider moves
-- it (the app deletes the old row first); a rider has at most one bracelet.
create table public.rider_cards (
  card_number text primary key check (card_number ~ '^[0-9]{6,32}$'),
  rider_id uuid not null unique references public.riders(id) on delete cascade,
  bound_at timestamptz not null default now()
);

alter table public.ride_plans enable row level security;
alter table public.riders enable row level security;
alter table public.rider_cards enable row level security;

revoke all on public.ride_plans, public.riders, public.rider_cards from anon;

alter table public.staff_roles drop constraint staff_roles_permissions_known;
alter table public.staff_roles add constraint staff_roles_permissions_known check (
  permissions <@ array['apzvalga', 'rezervacijos', 'uzimtumas', 'uzklausos', 'keturraciai', 'kuponai', 'nuolaidos', 'renginiai', 'pirtis', 'kainos', 'apyrankes']
);

create policy "apyrankes ride plans read" on public.ride_plans
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes ride plans insert" on public.ride_plans
  for insert to authenticated with check ((select private.has_permission('apyrankes')));
create policy "apyrankes ride plans update" on public.ride_plans
  for update to authenticated using ((select private.has_permission('apyrankes'))) with check ((select private.has_permission('apyrankes')));
create policy "apyrankes ride plans delete" on public.ride_plans
  for delete to authenticated using ((select private.has_permission('apyrankes')));

create policy "apyrankes riders read" on public.riders
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes riders insert" on public.riders
  for insert to authenticated with check ((select private.has_permission('apyrankes')));
create policy "apyrankes riders update" on public.riders
  for update to authenticated using ((select private.has_permission('apyrankes'))) with check ((select private.has_permission('apyrankes')));
create policy "apyrankes riders delete" on public.riders
  for delete to authenticated using ((select private.has_permission('apyrankes')));

create policy "apyrankes rider cards read" on public.rider_cards
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes rider cards insert" on public.rider_cards
  for insert to authenticated with check ((select private.has_permission('apyrankes')));
create policy "apyrankes rider cards update" on public.rider_cards
  for update to authenticated using ((select private.has_permission('apyrankes'))) with check ((select private.has_permission('apyrankes')));
create policy "apyrankes rider cards delete" on public.rider_cards
  for delete to authenticated using ((select private.has_permission('apyrankes')));

insert into public.ride_plans (name, description, price, sort_order) values
  ('Dienos bilietas', 'Visa diena vandens parke.', 35.00, 0),
  ('10 kartų', '10 apsilankymų, naudoti bet kada.', 120.00, 1),
  ('Sezono bilietas', 'Neribotai visą sezoną.', 450.00, 2),
  ('Darbuotojas', 'Komandos narys — be mokesčio.', null, 3);
