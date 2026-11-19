-- Vanduo Marse: the event types (renginio tipas) of the price calculator, editable in /admin/kainos.
--
-- Until now they were a fixed list in lib/event-pricing.ts. Each one only suggests a typical group size and
-- shows the typical price per guest; nothing else is chosen for the visitor. Public read (the calculator),
-- write for the Kainodara page permission.

create table public.event_presets (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  label text not null check (length(trim(label)) between 2 and 60),
  per_guest_min numeric(10, 2) not null check (per_guest_min >= 0),
  per_guest_max numeric(10, 2) not null,
  adults integer not null check (adults between 1 and 1000),
  kids integer not null default 0 check (kids between 0 and 1000),
  sort_order smallint not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint event_presets_range check (per_guest_max >= per_guest_min)
);

comment on table public.event_presets is 'Event types of the price calculator: suggested group size and typical price per guest. Edited in /admin/kainos.';

create index event_presets_sort_idx on public.event_presets (sort_order);

create trigger event_presets_updated_at before update on public.event_presets
  for each row execute function public.set_updated_at();

alter table public.event_presets enable row level security;

create policy "public read event presets" on public.event_presets
  for select to anon, authenticated using (true);

create policy "kainos event presets insert" on public.event_presets
  for insert to authenticated with check ((select private.has_permission('kainos')));

create policy "kainos event presets update" on public.event_presets
  for update to authenticated using ((select private.has_permission('kainos'))) with check ((select private.has_permission('kainos')));

create policy "kainos event presets delete" on public.event_presets
  for delete to authenticated using ((select private.has_permission('kainos')));

insert into public.event_presets (id, label, per_guest_min, per_guest_max, adults, kids, sort_order) values
  ('vestuves', 'Vestuvės', 55, 95, 120, 0, 10),
  ('vestuves-kamerines', 'Kamerinės vestuvės', 45, 70, 30, 0, 20),
  ('krikstynos', 'Krikštynos', 25, 45, 20, 5, 30),
  ('gimtadienis', 'Gimtadienis', 35, 65, 25, 0, 40),
  ('teambuilding', 'Komandos diena', 45, 85, 40, 0, 50),
  ('imones-svente', 'Įmonės šventė', 60, 120, 300, 0, 60),
  ('konferencija', 'Konferencija', 15, 35, 60, 0, 70),
  ('bernvakaris', 'Bernvakaris / mergvakaris', 153, 238, 15, 0, 80);
