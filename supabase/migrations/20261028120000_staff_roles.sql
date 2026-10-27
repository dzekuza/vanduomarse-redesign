-- Vanduo Marse: staff roles and per-page permissions.
--
-- Until now any row in public.staff could do everything. Now every staff member
-- has a role: the built-in Owner (all pages + staff management) or a custom role
-- that lists the admin pages it may use. The permission is enforced here, in row
-- level security, not only hidden in the menu.
--
-- Permissions are page keys (see staff_roles_permissions_known). A page that
-- shows another page's data gets read-only access to it:
--   apzvalga     reads bookings, inquiries, events
--   rezervacijos reads sauna blocks and sauna extras (the new-booking dialog)
--   uzimtumas    reads bookings (the occupancy views)
--   keturraciai  also sees and confirms tickets of quad tours (events category 'keturratis')
-- Staff management and cabin types are owner-only.

-- ---------------------------------------------------------------------------
-- Roles and staff columns
-- ---------------------------------------------------------------------------

create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  description text not null default '' check (char_length(description) <= 120),
  is_owner boolean not null default false,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_roles_permissions_known check (
    permissions <@ array['apzvalga', 'rezervacijos', 'uzimtumas', 'uzklausos', 'keturraciai', 'kuponai', 'renginiai', 'pirtis', 'kainos']
  ),
  -- The owner implicitly has everything; its list stays empty.
  constraint staff_roles_owner_implicit check (not is_owner or permissions = '{}')
);

create unique index staff_roles_name_idx on public.staff_roles (lower(name));
create unique index staff_roles_one_owner_idx on public.staff_roles (is_owner) where is_owner;

create trigger staff_roles_updated_at before update on public.staff_roles
  for each row execute function public.set_updated_at();

insert into public.staff_roles (name, description, is_owner)
values ('Savininkas', 'Pilna prieiga ir darbuotojų valdymas', true);

alter table public.staff
  add column role_id uuid references public.staff_roles (id) on delete restrict,
  add column email text not null default '',
  add column active boolean not null default true;

-- Everyone who has admin access today keeps it: they become owners.
update public.staff s
   set role_id = (select r.id from public.staff_roles r where r.is_owner),
       email = coalesce((select u.email from auth.users u where u.id = s.user_id), '');

alter table public.staff alter column role_id set not null;
create index staff_role_idx on public.staff (role_id);

comment on table public.staff is 'Users allowed into /admin. Their role (staff_roles) says which pages; see private.has_permission().';

-- ---------------------------------------------------------------------------
-- Permission helpers (private schema: not RPCs)
-- ---------------------------------------------------------------------------

-- Any active staff member (replaces the old membership check, same signature).
create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff s where s.user_id = (select auth.uid()) and s.active);
$$;

create function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s join public.staff_roles r on r.id = s.role_id
    where s.user_id = (select auth.uid()) and s.active and r.is_owner
  );
$$;

create function private.has_permission(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s join public.staff_roles r on r.id = s.role_id
    where s.user_id = (select auth.uid()) and s.active and (r.is_owner or p = any (r.permissions))
  );
$$;

create function private.has_any_permission(p text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s join public.staff_roles r on r.id = s.role_id
    where s.user_id = (select auth.uid()) and s.active and (r.is_owner or r.permissions && p)
  );
$$;

revoke execute on function private.is_owner() from public, anon;
revoke execute on function private.has_permission(text) from public, anon;
revoke execute on function private.has_any_permission(text[]) from public, anon;
grant execute on function private.is_owner() to authenticated;
grant execute on function private.has_permission(text) to authenticated;
grant execute on function private.has_any_permission(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Guards: never lose the last owner, never edit the owner role
-- ---------------------------------------------------------------------------

create function private.keep_an_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.staff_roles r where r.id = old.role_id and r.is_owner and old.active)
     and (tg_op = 'DELETE' or new.role_id is distinct from old.role_id or not new.active)
     and not exists (
       select 1 from public.staff s join public.staff_roles r on r.id = s.role_id
       where r.is_owner and s.active and s.user_id <> old.user_id
     ) then
    raise exception 'The last owner cannot be removed, demoted or deactivated'
      using errcode = '23514', hint = 'last_owner';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger staff_keep_an_owner before update or delete on public.staff
  for each row execute function private.keep_an_owner();

create function private.protect_owner_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_owner and (tg_op = 'DELETE' or new.is_owner is distinct from old.is_owner or new.permissions is distinct from old.permissions) then
    raise exception 'The owner role cannot be deleted or changed' using errcode = '23514', hint = 'owner_role';
  end if;
  if tg_op = 'UPDATE' and new.is_owner and not old.is_owner then
    raise exception 'A role cannot become the owner role' using errcode = '23514', hint = 'owner_role';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger staff_roles_protect_owner before update or delete on public.staff_roles
  for each row execute function private.protect_owner_role();

revoke execute on function private.keep_an_owner() from public, anon, authenticated;
revoke execute on function private.protect_owner_role() from public, anon, authenticated;

-- Consistency triggers must see every row whatever the caller may read, so a
-- role that can't see all bookings, events or tickets can't skip a capacity check.
alter function public.enforce_sauna_block_free() security definer;
alter function public.enforce_block_not_booked() security definer;
alter function public.enforce_stay_capacity() security definer;
alter function public.enforce_ticket_capacity() security definer;
alter function public.sync_event_sold() security definer;
alter function public.enforce_quad_capacity() security definer;
alter function public.apply_coupon_redemption() security definer;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.staff_roles enable row level security;

-- staff: your own row, or all of them for an owner; only owners change them.
drop policy "staff read staff" on public.staff;
create policy "own staff row or owner reads all" on public.staff
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_owner()));
create policy "owner inserts staff" on public.staff
  for insert to authenticated with check ((select private.is_owner()));
create policy "owner updates staff" on public.staff
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner deletes staff" on public.staff
  for delete to authenticated using ((select private.is_owner()));

-- staff_roles: every active staff member reads the roles; owners manage them.
create policy "staff read roles" on public.staff_roles
  for select to authenticated using ((select private.is_staff()));
create policy "owner inserts roles" on public.staff_roles
  for insert to authenticated with check ((select private.is_owner()));
create policy "owner updates roles" on public.staff_roles
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner deletes roles" on public.staff_roles
  for delete to authenticated using ((select private.is_owner()));

-- Replace every "is any staff" policy with its page permission.
drop policy "staff manage bookings" on public.bookings;
drop policy "staff manage booking extras" on public.booking_extras;
drop policy "staff manage sauna blocks" on public.sauna_blocks;
drop policy "staff manage inquiries" on public.inquiries;
drop policy "staff manage inquiry notes" on public.inquiry_notes;
drop policy "staff manage sauna event templates" on public.sauna_event_templates;
drop policy "staff manage event tickets" on public.event_tickets;
drop policy "authenticated read events" on public.events;
drop policy "staff insert events" on public.events;
drop policy "staff update events" on public.events;
drop policy "staff delete events" on public.events;
drop policy "staff insert price items" on public.price_items;
drop policy "staff update price items" on public.price_items;
drop policy "staff delete price items" on public.price_items;
drop policy "staff update sauna settings" on public.sauna_settings;
drop policy "authenticated read upsells" on public.sauna_upsells;
drop policy "staff insert upsells" on public.sauna_upsells;
drop policy "staff update upsells" on public.sauna_upsells;
drop policy "staff delete upsells" on public.sauna_upsells;
drop policy "staff insert stay types" on public.stay_types;
drop policy "staff update stay types" on public.stay_types;
drop policy "staff delete stay types" on public.stay_types;
drop policy "authenticated read coupon products" on public.coupon_products;
drop policy "staff insert coupon products" on public.coupon_products;
drop policy "staff update coupon products" on public.coupon_products;
drop policy "staff delete coupon products" on public.coupon_products;
drop policy "staff manage coupons" on public.coupons;
drop policy "staff manage coupon redemptions" on public.coupon_redemptions;
drop policy "authenticated read quad types" on public.quad_types;
drop policy "staff insert quad types" on public.quad_types;
drop policy "staff update quad types" on public.quad_types;
drop policy "staff delete quad types" on public.quad_types;
drop policy "staff update quad settings" on public.quad_settings;
drop policy "staff manage quad rentals" on public.quad_rentals;

create policy "rezervacijos bookings read" on public.bookings
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga'])));

create policy "rezervacijos bookings insert" on public.bookings
  for insert to authenticated with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos bookings update" on public.bookings
  for update to authenticated using ((select private.has_permission('rezervacijos'))) with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos bookings delete" on public.bookings
  for delete to authenticated using ((select private.has_permission('rezervacijos')));

create policy "rezervacijos booking extras read" on public.booking_extras
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga'])));

create policy "rezervacijos booking extras insert" on public.booking_extras
  for insert to authenticated with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos booking extras update" on public.booking_extras
  for update to authenticated using ((select private.has_permission('rezervacijos'))) with check ((select private.has_permission('rezervacijos')));

create policy "rezervacijos booking extras delete" on public.booking_extras
  for delete to authenticated using ((select private.has_permission('rezervacijos')));

create policy "uzimtumas sauna blocks read" on public.sauna_blocks
  for select to authenticated using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas'])));

create policy "uzimtumas sauna blocks insert" on public.sauna_blocks
  for insert to authenticated with check ((select private.has_permission('uzimtumas')));

create policy "uzimtumas sauna blocks update" on public.sauna_blocks
  for update to authenticated using ((select private.has_permission('uzimtumas'))) with check ((select private.has_permission('uzimtumas')));

create policy "uzimtumas sauna blocks delete" on public.sauna_blocks
  for delete to authenticated using ((select private.has_permission('uzimtumas')));

create policy "uzklausos inquiries read" on public.inquiries
  for select to authenticated using ((select private.has_any_permission(array['uzklausos', 'apzvalga'])));

create policy "uzklausos inquiries insert" on public.inquiries
  for insert to authenticated with check ((select private.has_permission('uzklausos')));

create policy "uzklausos inquiries update" on public.inquiries
  for update to authenticated using ((select private.has_permission('uzklausos'))) with check ((select private.has_permission('uzklausos')));

create policy "uzklausos inquiries delete" on public.inquiries
  for delete to authenticated using ((select private.has_permission('uzklausos')));

create policy "uzklausos inquiry notes" on public.inquiry_notes
  for all to authenticated using ((select private.has_permission('uzklausos'))) with check ((select private.has_permission('uzklausos')));

create policy "renginiai sauna event templates" on public.sauna_event_templates
  for all to authenticated using ((select private.has_permission('renginiai'))) with check ((select private.has_permission('renginiai')));

create policy "renginiai events read" on public.events
  for select to authenticated using (published or (select private.has_any_permission(array['renginiai', 'keturraciai', 'apzvalga'])));

create policy "renginiai events insert" on public.events
  for insert to authenticated with check ((select private.has_permission('renginiai')));

create policy "renginiai events update" on public.events
  for update to authenticated using ((select private.has_permission('renginiai'))) with check ((select private.has_permission('renginiai')));

create policy "renginiai events delete" on public.events
  for delete to authenticated using ((select private.has_permission('renginiai')));

create policy "renginiai and keturraciai event tickets" on public.event_tickets
  for all to authenticated using ((select private.has_permission('renginiai')) or ((select private.has_permission('keturraciai')) and exists (select 1 from public.events e where e.id = event_tickets.event_id and e.category = 'keturratis'))) with check ((select private.has_permission('renginiai')) or ((select private.has_permission('keturraciai')) and exists (select 1 from public.events e where e.id = event_tickets.event_id and e.category = 'keturratis')));

create policy "kainos price items insert" on public.price_items
  for insert to authenticated with check ((select private.has_permission('kainos')));

create policy "kainos price items update" on public.price_items
  for update to authenticated using ((select private.has_permission('kainos'))) with check ((select private.has_permission('kainos')));

create policy "kainos price items delete" on public.price_items
  for delete to authenticated using ((select private.has_permission('kainos')));

create policy "pirtis sauna settings update" on public.sauna_settings
  for update to authenticated using ((select private.has_permission('pirtis'))) with check ((select private.has_permission('pirtis')));

create policy "pirtis upsells read" on public.sauna_upsells
  for select to authenticated using (active or (select private.has_any_permission(array['pirtis', 'rezervacijos'])));

create policy "pirtis upsells insert" on public.sauna_upsells
  for insert to authenticated with check ((select private.has_permission('pirtis')));

create policy "pirtis upsells update" on public.sauna_upsells
  for update to authenticated using ((select private.has_permission('pirtis'))) with check ((select private.has_permission('pirtis')));

create policy "pirtis upsells delete" on public.sauna_upsells
  for delete to authenticated using ((select private.has_permission('pirtis')));

create policy "owner stay types insert" on public.stay_types
  for insert to authenticated with check ((select private.is_owner()));

create policy "owner stay types update" on public.stay_types
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "owner stay types delete" on public.stay_types
  for delete to authenticated using ((select private.is_owner()));

create policy "kuponai coupon products read" on public.coupon_products
  for select to authenticated using (active or (select private.has_permission('kuponai')));

create policy "kuponai coupon products insert" on public.coupon_products
  for insert to authenticated with check ((select private.has_permission('kuponai')));

create policy "kuponai coupon products update" on public.coupon_products
  for update to authenticated using ((select private.has_permission('kuponai'))) with check ((select private.has_permission('kuponai')));

create policy "kuponai coupon products delete" on public.coupon_products
  for delete to authenticated using ((select private.has_permission('kuponai')));

create policy "kuponai coupons" on public.coupons
  for all to authenticated using ((select private.has_permission('kuponai'))) with check ((select private.has_permission('kuponai')));

create policy "kuponai coupon redemptions" on public.coupon_redemptions
  for all to authenticated using ((select private.has_permission('kuponai'))) with check ((select private.has_permission('kuponai')));

create policy "keturraciai quad types read" on public.quad_types
  for select to authenticated using (active or (select private.has_permission('keturraciai')));

create policy "keturraciai quad types insert" on public.quad_types
  for insert to authenticated with check ((select private.has_permission('keturraciai')));

create policy "keturraciai quad types update" on public.quad_types
  for update to authenticated using ((select private.has_permission('keturraciai'))) with check ((select private.has_permission('keturraciai')));

create policy "keturraciai quad types delete" on public.quad_types
  for delete to authenticated using ((select private.has_permission('keturraciai')));

create policy "keturraciai quad settings update" on public.quad_settings
  for update to authenticated using ((select private.has_permission('keturraciai'))) with check ((select private.has_permission('keturraciai')));

create policy "keturraciai quad rentals" on public.quad_rentals
  for all to authenticated using ((select private.has_permission('keturraciai'))) with check ((select private.has_permission('keturraciai')));

-- ---------------------------------------------------------------------------
-- Functions that were staff-only
-- ---------------------------------------------------------------------------

create or replace function public.activate_coupon(p_id uuid)
returns table (code text, expires_at date)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text;
  v_expires date := ((now() at time zone 'Europe/Vilnius')::date + interval '12 months')::date;
begin
  if not (select private.has_permission('kuponai')) then
    raise exception 'Staff only' using errcode = '42501';
  end if;

  loop
    v_code := private.generate_coupon_code();
    exit when not exists (select 1 from public.coupons c where c.code = v_code);
  end loop;

  return query
  update public.coupons c
     set code = v_code, status = 'aktyvus', paid_at = now(), expires_at = v_expires
   where c.id = p_id and c.status = 'laukia_apmokejimo'
  returning c.code, c.expires_at;

  if not found then
    raise exception 'Order is not awaiting payment' using errcode = '23514', hint = 'coupon_not_pending';
  end if;
end;
$$;

create or replace function public.materialize_sauna_events(p_from date, p_days integer default 14)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select private.has_permission('renginiai')) then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  if p_days not between 1 and 180 then
    raise exception 'p_days must be 1-180' using errcode = '22023';
  end if;

  insert into public.events (title, category, date, start_time, duration_minutes, place, blurb, price, capacity, published, template_id)
  select t.title, 'pirtis', d::date, t.start_time, t.duration_minutes, 'Pirtis Marse · ' || t.host,
         t.blurb, t.price_per_person, t.capacity, true, t.id
  from public.sauna_event_templates t
  cross join generate_series(p_from, p_from + p_days - 1, interval '1 day') as d
  where t.active and extract(dow from d)::smallint = t.weekday
  on conflict (template_id, date) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
