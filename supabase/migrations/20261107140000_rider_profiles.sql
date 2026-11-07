-- Vanduo Marse: rider profiles, purchase history, comments, documents (ADR-0039).
--
-- Extends /admin/apyrankes: a rider is now a full customer record (contact
-- details, birthdate, a profile photo), and every plan assignment is logged
-- in `purchases` so the rider page can show sales history, which purchases
-- are still active services, and which are long-running subscriptions
-- ("abonementai", by plan category). Staff can also attach documents (ID
-- scan, signed waiver) and free-text comments. Also replaces the four
-- placeholder starter plans with the real "Plaukimas" price list and adds a
-- `category` column so the catalogue can grow into the park's other tabs
-- (Įranga, Abonementai, Pramogos, Apgyvendinimas, Parduotuvė, Dubenėlyje).

-- ---------------------------------------------------------------------------
-- Rider profile fields
-- ---------------------------------------------------------------------------

alter table public.riders
  add column phone text check (phone is null or char_length(phone) <= 30),
  add column phone2 text check (phone2 is null or char_length(phone2) <= 30),
  add column email text check (email is null or char_length(email) <= 120),
  add column birthdate date,
  add column avatar_path text;

-- ---------------------------------------------------------------------------
-- Plan catalogue: categories + the real Plaukimas price list
-- ---------------------------------------------------------------------------

alter table public.ride_plans
  add column category text not null default 'Plaukimas' check (
    category in ('Plaukimas', 'Įranga', 'Abonementai', 'Pramogos', 'Apgyvendinimas', 'Parduotuvė', 'Dubenėlyje')
  );

-- Move the one rider currently on the placeholder "Dienos bilietas" onto its
-- closest real replacement before the placeholder plans are removed.
with new_day_pass as (
  insert into public.ride_plans (name, description, price, category, sort_order)
  values ('Dienos plaukimo bilietas', 'Visa diena baseine.', 35.00, 'Plaukimas', 10)
  returning id
)
update public.riders
set plan_id = (select id from new_day_pass)
where plan_id in (select id from public.ride_plans where name = 'Dienos bilietas');

delete from public.ride_plans where name in ('Dienos bilietas', '10 kartų', 'Sezono bilietas', 'Darbuotojas');

insert into public.ride_plans (name, description, price, category, sort_order) values
  ('Naujoko Valanda', '', 15.00, 'Plaukimas', 0),
  ('1 val. iki 17:00', '', 15.00, 'Plaukimas', 1),
  ('2 val. iki 17:00', '', 20.00, 'Plaukimas', 2),
  ('1 val. iki 17:00 (vaikas)', '', 10.00, 'Plaukimas', 3),
  ('2 val. iki 17:00 (vaikas)', '', 14.00, 'Plaukimas', 4),
  ('1 val. nuo 17:00 ir savaitgaliais', '', 20.00, 'Plaukimas', 5),
  ('2 val. nuo 17:00 ir savaitgaliais', '', 25.00, 'Plaukimas', 6),
  ('1 val. nuo 17:00 ir savaitgaliais (vaikas)', '', 14.00, 'Plaukimas', 7),
  ('2 val. nuo 17:00 ir savaitgaliais (vaikas)', '', 17.00, 'Plaukimas', 8),
  ('Naujoko bilietas', '', 25.00, 'Plaukimas', 9),
  ('Dienos plaukimo bilietas (vaikas)', '', 25.00, 'Plaukimas', 11),
  ('Papildoma valanda', '', 10.00, 'Plaukimas', 12);

-- ---------------------------------------------------------------------------
-- Purchase history ("sales"): one row per plan assignment, snapshotted so a
-- later plan edit or delete never rewrites what was actually sold.
-- ---------------------------------------------------------------------------

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  plan_id uuid references public.ride_plans(id) on delete set null,
  plan_name text not null,
  plan_category text not null,
  price numeric(10, 2) check (price is null or price >= 0),
  sold_by uuid references auth.users(id) on delete set null,
  sold_at timestamptz not null default now()
);
create index purchases_rider_idx on public.purchases (rider_id, sold_at desc);

create table public.rider_comments (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  created_at timestamptz not null default now()
);
create index rider_comments_rider_idx on public.rider_comments (rider_id, created_at desc);

create table public.rider_documents (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  file_path text not null,
  file_name text not null check (char_length(file_name) between 1 and 200),
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create index rider_documents_rider_idx on public.rider_documents (rider_id, uploaded_at desc);

alter table public.purchases enable row level security;
alter table public.rider_comments enable row level security;
alter table public.rider_documents enable row level security;

revoke all on public.purchases, public.rider_comments, public.rider_documents from anon;

-- Sales history is an audit log: staff can read and add to it, never edit or delete.
create policy "apyrankes purchases read" on public.purchases
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes purchases insert" on public.purchases
  for insert to authenticated with check ((select private.has_permission('apyrankes')));

create policy "apyrankes rider comments read" on public.rider_comments
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes rider comments insert" on public.rider_comments
  for insert to authenticated with check ((select private.has_permission('apyrankes')));
create policy "apyrankes rider comments delete" on public.rider_comments
  for delete to authenticated using ((select private.has_permission('apyrankes')));

create policy "apyrankes rider documents read" on public.rider_documents
  for select to authenticated using ((select private.has_permission('apyrankes')));
create policy "apyrankes rider documents insert" on public.rider_documents
  for insert to authenticated with check ((select private.has_permission('apyrankes')));
create policy "apyrankes rider documents delete" on public.rider_documents
  for delete to authenticated using ((select private.has_permission('apyrankes')));

-- ---------------------------------------------------------------------------
-- Storage: rider photos and documents. Both private (personal data, unlike
-- the public sauna-photos bucket) — served through short-lived signed URLs.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rider-photos', 'rider-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rider-documents', 'rider-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "apyrankes rider photos read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('apyrankes')));
create policy "apyrankes rider photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'rider-photos' and (select private.has_permission('apyrankes')));
create policy "apyrankes rider photos update" on storage.objects
  for update to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('apyrankes')))
  with check (bucket_id = 'rider-photos' and (select private.has_permission('apyrankes')));
create policy "apyrankes rider photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('apyrankes')));

create policy "apyrankes rider documents storage read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-documents' and (select private.has_permission('apyrankes')));
create policy "apyrankes rider documents storage insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'rider-documents' and (select private.has_permission('apyrankes')));
create policy "apyrankes rider documents storage delete" on storage.objects
  for delete to authenticated using (bucket_id = 'rider-documents' and (select private.has_permission('apyrankes')));
