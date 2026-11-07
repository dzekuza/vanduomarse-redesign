-- Vanduo Marse: instructor session scanning (ADR-0044).
--
-- A new `instruktorius` page permission for a narrow, phone-friendly screen:
-- scan a rider's bracelet to check them in/out of the water and see who is
-- currently out and for how long. `rider_sessions` is an open/closed interval
-- per rider — scanning while they have no open session starts one, scanning
-- again closes it. At most one open session per rider.

create table public.rider_sessions (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  -- Snapshot of the bracelet used for this session; not a FK (a bracelet can be rebound later).
  card_number text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index rider_sessions_rider_id_idx on public.rider_sessions(rider_id);
create unique index rider_sessions_one_open_idx on public.rider_sessions(rider_id) where ended_at is null;

alter table public.rider_sessions enable row level security;
revoke all on public.rider_sessions from anon;

alter table public.staff_roles drop constraint staff_roles_permissions_known;
alter table public.staff_roles add constraint staff_roles_permissions_known check (
  permissions <@ array['apzvalga', 'rezervacijos', 'uzimtumas', 'uzklausos', 'keturraciai', 'kuponai', 'nuolaidos', 'renginiai', 'pirtis', 'kainos', 'apyrankes', 'klientai', 'instruktorius']
);

create policy "instruktorius rider sessions read" on public.rider_sessions
  for select to authenticated using ((select private.has_permission('instruktorius')));
create policy "instruktorius rider sessions insert" on public.rider_sessions
  for insert to authenticated with check ((select private.has_permission('instruktorius')));
create policy "instruktorius rider sessions update" on public.rider_sessions
  for update to authenticated using ((select private.has_permission('instruktorius'))) with check ((select private.has_permission('instruktorius')));

-- Read-only visibility into riders/plans/bracelets, needed to resolve a scan (ADR-0012 style).
create policy "instruktorius riders read" on public.riders
  for select to authenticated using ((select private.has_permission('instruktorius')));
create policy "instruktorius ride plans read" on public.ride_plans
  for select to authenticated using ((select private.has_permission('instruktorius')));
create policy "instruktorius rider cards read" on public.rider_cards
  for select to authenticated using ((select private.has_permission('instruktorius')));

create policy "instruktorius rider photos read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('instruktorius')));
