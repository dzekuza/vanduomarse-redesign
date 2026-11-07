-- Vanduo Marse: Klientai — riders is the one customer identity anchor (ADR-0041).
--
-- riders already holds 140 imported Grabby contacts alongside bracelet-pass
-- riders (20261107150000_rider_grabby_import made plan_id optional for exactly
-- this), so Klientai does not get a second "customers" table — it is a new,
-- standalone page and permission reading and writing the same riders rows.
-- bookings / quad_rentals / event_tickets / coupons each store contact details
-- inline; this migration adds a nullable rider_id back-link to each so a
-- customer's profile can show one activity timeline, and backfills it once for
-- every existing row by matching phone (private.norm_phone) or email, creating
-- a rider for any contact that doesn't already have one.

-- ---------------------------------------------------------------------------
-- Permission
-- ---------------------------------------------------------------------------

alter table public.staff_roles drop constraint staff_roles_permissions_known;
alter table public.staff_roles add constraint staff_roles_permissions_known check (
  permissions <@ array['apzvalga', 'rezervacijos', 'uzimtumas', 'uzklausos', 'keturraciai', 'kuponai', 'nuolaidos', 'renginiai', 'pirtis', 'kainos', 'apyrankes', 'klientai']
);

-- ---------------------------------------------------------------------------
-- Back-links from every customer-touching table to riders
-- ---------------------------------------------------------------------------

alter table public.bookings add column rider_id uuid references public.riders(id) on delete set null;
alter table public.quad_rentals add column rider_id uuid references public.riders(id) on delete set null;
alter table public.event_tickets add column rider_id uuid references public.riders(id) on delete set null;
alter table public.coupons add column rider_id uuid references public.riders(id) on delete set null;

create index bookings_rider_idx on public.bookings (rider_id);
create index quad_rentals_rider_idx on public.quad_rentals (rider_id);
create index event_tickets_rider_idx on public.event_tickets (rider_id);
create index coupons_rider_idx on public.coupons (rider_id);

-- ---------------------------------------------------------------------------
-- One-time backfill: match every existing contact to a rider, or create one
-- ---------------------------------------------------------------------------

create temporary table backfill_contacts as
select 'bookings' as src, id as src_id, customer_name as name, customer_phone as phone, customer_email as email from public.bookings where rider_id is null
union all
select 'quad_rentals', id, customer_name, customer_phone, customer_email from public.quad_rentals where rider_id is null
union all
select 'event_tickets', id, customer_name, customer_phone, customer_email from public.event_tickets where rider_id is null
union all
select 'coupons', id, buyer_name, buyer_phone, buyer_email from public.coupons where rider_id is null;

alter table backfill_contacts add column key text;
update backfill_contacts set key = coalesce(nullif(private.norm_phone(phone), ''), lower(trim(email)));
delete from backfill_contacts where key is null;

create temporary table backfill_match as
select bc.src, bc.src_id, bc.key, bc.name, bc.phone, bc.email,
  (select r.id from public.riders r
   where (private.norm_phone(r.phone) <> '' and private.norm_phone(r.phone) = private.norm_phone(bc.phone))
      or (bc.email is not null and lower(trim(r.email)) = lower(trim(bc.email)))
   order by r.created_at limit 1) as rider_id
from backfill_contacts bc;

with to_create as (
  select distinct on (key) key, name, phone, email
  from backfill_match
  where rider_id is null
), inserted as (
  insert into public.riders (name, surname, phone, email)
  select
    coalesce(nullif(split_part(trim(tc.name), ' ', 1), ''), 'Klientas'),
    coalesce(nullif(trim(substring(trim(tc.name) from length(split_part(trim(tc.name), ' ', 1)) + 1)), ''), '-'),
    tc.phone, tc.email
  from to_create tc
  returning id, coalesce(nullif(private.norm_phone(phone), ''), lower(trim(email))) as key
)
update backfill_match bm
set rider_id = i.id
from inserted i
where bm.rider_id is null and bm.key = i.key;

update public.bookings b set rider_id = bm.rider_id
from backfill_match bm where bm.src = 'bookings' and bm.src_id = b.id and bm.rider_id is not null;

update public.quad_rentals q set rider_id = bm.rider_id
from backfill_match bm where bm.src = 'quad_rentals' and bm.src_id = q.id and bm.rider_id is not null;

update public.event_tickets e set rider_id = bm.rider_id
from backfill_match bm where bm.src = 'event_tickets' and bm.src_id = e.id and bm.rider_id is not null;

update public.coupons c set rider_id = bm.rider_id
from backfill_match bm where bm.src = 'coupons' and bm.src_id = c.id and bm.rider_id is not null;

drop table backfill_match;
drop table backfill_contacts;

-- ---------------------------------------------------------------------------
-- RLS: klientai gets its own additive policies on riders and its side tables
-- (apyrankes keeps its existing ones unchanged — permissive policies for the
-- same command OR together).
-- ---------------------------------------------------------------------------

create policy "klientai riders read" on public.riders
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai riders insert" on public.riders
  for insert to authenticated with check ((select private.has_permission('klientai')));
create policy "klientai riders update" on public.riders
  for update to authenticated using ((select private.has_permission('klientai'))) with check ((select private.has_permission('klientai')));
create policy "klientai riders delete" on public.riders
  for delete to authenticated using ((select private.has_permission('klientai')));

create policy "klientai rider comments read" on public.rider_comments
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai rider comments insert" on public.rider_comments
  for insert to authenticated with check ((select private.has_permission('klientai')));
create policy "klientai rider comments delete" on public.rider_comments
  for delete to authenticated using ((select private.has_permission('klientai')));

create policy "klientai rider documents read" on public.rider_documents
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai rider documents insert" on public.rider_documents
  for insert to authenticated with check ((select private.has_permission('klientai')));
create policy "klientai rider documents delete" on public.rider_documents
  for delete to authenticated using ((select private.has_permission('klientai')));

create policy "klientai purchases read" on public.purchases
  for select to authenticated using ((select private.has_permission('klientai')));

-- Read-only visibility into a customer's activity across the booking-adjacent
-- tables, mirroring the existing apzvalga-style read-only dependency pattern.
create policy "klientai bookings read" on public.bookings
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai quad rentals read" on public.quad_rentals
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai event tickets read" on public.event_tickets
  for select to authenticated using ((select private.has_permission('klientai')));
create policy "klientai coupons read" on public.coupons
  for select to authenticated using ((select private.has_permission('klientai')));

-- Storage: klientai gets the same rider-photos / rider-documents access apyrankes has.
create policy "klientai rider photos read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('klientai')));
create policy "klientai rider photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'rider-photos' and (select private.has_permission('klientai')));
create policy "klientai rider photos update" on storage.objects
  for update to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('klientai'))) with check (bucket_id = 'rider-photos' and (select private.has_permission('klientai')));
create policy "klientai rider photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'rider-photos' and (select private.has_permission('klientai')));

create policy "klientai rider documents storage read" on storage.objects
  for select to authenticated using (bucket_id = 'rider-documents' and (select private.has_permission('klientai')));
create policy "klientai rider documents storage insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'rider-documents' and (select private.has_permission('klientai')));
create policy "klientai rider documents storage delete" on storage.objects
  for delete to authenticated using (bucket_id = 'rider-documents' and (select private.has_permission('klientai')));
