-- Vanduo Marse: guided quad tour products (ADR-0053).
--
-- The public quad page sold Mini / Midi / Maxi tours from constants in the app
-- (route, price per quad, gear, minimum quads, cancellation line) that the database
-- never saw, so a tour could not be paid for: checkout prices every request from
-- database rows. This moves the products into tables and adds one request RPC that
-- prices a tour from them and reserves real quads from the fleet.
--
-- Additive only: two new tables, three new columns, one new function. Existing
-- functions, policies and rows are untouched.

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.quad_tour_routes (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  kilometres smallint not null check (kilometres between 1 and 500),
  hours smallint not null check (hours between 1 and 8),
  -- Shown on the card, e.g. "Iki 2 val."; the booking uses `hours`.
  duration_label text not null default '' check (char_length(duration_label) <= 30),
  -- EUR per quad incl. 21% PVM; the same for a driver alone or with a passenger.
  price numeric(10, 2) not null check (price >= 0),
  min_units smallint not null default 3 check (min_units between 1 and 20),
  description text not null default '' check (char_length(description) <= 200),
  long_description text not null default '' check (char_length(long_description) <= 1200),
  -- A path under /public, e.g. "/quads/ciongo/mini-route.webp".
  photo text not null default '' check (char_length(photo) <= 200),
  badge text check (badge is null or char_length(badge) <= 20),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quad_tour_accessories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  -- EUR per item incl. 21% PVM.
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quad_tour_routes_updated_at before update on public.quad_tour_routes
  for each row execute function public.set_updated_at();
create trigger quad_tour_accessories_updated_at before update on public.quad_tour_accessories
  for each row execute function public.set_updated_at();

-- The "free cancellation" line shown with a tour; empty hides it.
alter table public.quad_settings
  add column tour_cancellation_note text not null default '' check (char_length(tour_cancellation_note) <= 200);

-- A tour booking is a normal quad rental that remembers its route and gear.
alter table public.quad_rentals
  add column tour_route_id text references public.quad_tour_routes (id) on update cascade on delete restrict,
  add column tour_accessories jsonb not null default '[]'::jsonb check (jsonb_typeof(tour_accessories) = 'array');

create index quad_rentals_tour_route_idx on public.quad_rentals (tour_route_id) where tour_route_id is not null;

-- ---------------------------------------------------------------------------
-- Row level security: anon reads what is offered, staff with `keturraciai` manage it
-- ---------------------------------------------------------------------------

alter table public.quad_tour_routes enable row level security;
alter table public.quad_tour_accessories enable row level security;

revoke all on public.quad_tour_routes, public.quad_tour_accessories from public, anon, authenticated;
grant select on public.quad_tour_routes, public.quad_tour_accessories to anon, authenticated;
grant insert, update, delete on public.quad_tour_routes, public.quad_tour_accessories to authenticated;

create policy "anon read active quad tour routes" on public.quad_tour_routes
  for select to anon using (active);
create policy "keturraciai quad tour routes read" on public.quad_tour_routes
  for select to authenticated using (active or (select private.has_permission('keturraciai')));
create policy "keturraciai quad tour routes insert" on public.quad_tour_routes
  for insert to authenticated with check ((select private.has_permission('keturraciai')));
create policy "keturraciai quad tour routes update" on public.quad_tour_routes
  for update to authenticated using ((select private.has_permission('keturraciai'))) with check ((select private.has_permission('keturraciai')));
create policy "keturraciai quad tour routes delete" on public.quad_tour_routes
  for delete to authenticated using ((select private.has_permission('keturraciai')));

create policy "anon read active quad tour accessories" on public.quad_tour_accessories
  for select to anon using (active);
create policy "keturraciai quad tour accessories read" on public.quad_tour_accessories
  for select to authenticated using (active or (select private.has_permission('keturraciai')));
create policy "keturraciai quad tour accessories insert" on public.quad_tour_accessories
  for insert to authenticated with check ((select private.has_permission('keturraciai')));
create policy "keturraciai quad tour accessories update" on public.quad_tour_accessories
  for update to authenticated using ((select private.has_permission('keturraciai'))) with check ((select private.has_permission('keturraciai')));
create policy "keturraciai quad tour accessories delete" on public.quad_tour_accessories
  for delete to authenticated using ((select private.has_permission('keturraciai')));

-- ---------------------------------------------------------------------------
-- Request: a tour for N quads on a day and start hour
--
-- Prices come only from the route and gear rows. The quads are taken from the
-- fleet (first type by sort order, then the next) for every hour of the route, so
-- the hourly rentals and tours share one stock; the capacity trigger rechecks it.
-- A single-type allocation is stored on the header, a mixed one as items, exactly
-- like create_quad_rental / create_mixed_quad_rental.
-- ---------------------------------------------------------------------------

create function public.create_quad_tour_rental(
  p_route_id text,
  p_date date,
  p_start_hour smallint,
  p_units smallint,
  p_accessories jsonb,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null,
  p_discount_code text default null
)
returns table (id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.quad_tour_routes;
  s public.quad_settings;
  t record;
  a record;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_id uuid := gen_random_uuid();
  v_remaining integer;
  v_taken integer;
  v_free integer;
  v_use integer;
  v_alloc jsonb := '[]'::jsonb;
  v_gear jsonb := '[]'::jsonb;
  v_gear_total numeric := 0;
  v_gear_text text;
  v_subtotal numeric;
  v_code_id uuid;
  v_code_text text;
  v_code_discount numeric;
  v_note text;
begin
  select * into r from public.quad_tour_routes where quad_tour_routes.id = p_route_id and quad_tour_routes.active;
  if not found then
    raise exception 'Tour route unavailable' using errcode = '23503', hint = 'quad_tour_unavailable';
  end if;
  if p_units is null or p_units < r.min_units or p_units > 20 then
    raise exception 'Invalid number of quads for this tour' using errcode = '23514', hint = 'quad_units';
  end if;

  -- Gear: [{"id": "...", "units": n}], each id once and offered; priced from its row.
  if p_accessories is not null and jsonb_typeof(p_accessories) is distinct from 'array' then
    raise exception 'Gear must be an array' using errcode = '23514', hint = 'quad_gear';
  end if;
  if coalesce(jsonb_array_length(p_accessories), 0) > 10 or exists (
    select 1 from jsonb_array_elements(coalesce(p_accessories, '[]'::jsonb)) as e
    where jsonb_typeof(e -> 'id') is distinct from 'string'
       or (e ->> 'id') !~ '^[a-z0-9-]{1,60}$'
       or jsonb_typeof(e -> 'units') is distinct from 'number'
       or (e ->> 'units') !~ '^([1-9]|[1-3][0-9]|40)$'
  ) then
    raise exception 'Invalid gear' using errcode = '23514', hint = 'quad_gear';
  end if;
  if (select count(distinct e ->> 'id') from jsonb_array_elements(coalesce(p_accessories, '[]'::jsonb)) as e)
     <> coalesce(jsonb_array_length(p_accessories), 0) then
    raise exception 'Gear listed twice' using errcode = '23514', hint = 'quad_gear';
  end if;
  for a in
    select e ->> 'id' as gear_id, (e ->> 'units')::integer as units
    from jsonb_array_elements(coalesce(p_accessories, '[]'::jsonb)) as e
  loop
    select g.id, g.name, g.price into t
    from public.quad_tour_accessories g where g.id = a.gear_id and g.active;
    if not found then
      raise exception 'Gear unavailable' using errcode = '23503', hint = 'quad_gear';
    end if;
    v_gear := v_gear || jsonb_build_array(jsonb_build_object('id', t.id, 'name', t.name, 'units', a.units, 'price', t.price));
    v_gear_total := v_gear_total + t.price * a.units;
  end loop;
  -- At most two items of gear per quad, like the form.
  if coalesce((select sum((e ->> 'units')::integer) from jsonb_array_elements(v_gear) as e), 0) > p_units * 2 then
    raise exception 'Too much gear' using errcode = '23514', hint = 'quad_gear';
  end if;

  select * into s from public.quad_settings where quad_settings.id;
  if not found or p_start_hour is null
     or p_start_hour < s.open_hour or p_start_hour + r.hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'quad_closed';
  end if;
  if p_date is null or p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'quad_past';
  end if;
  if (select count(*) from public.quad_rentals q
       where q.status = 'laukia' and q.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  -- Same lock order as the capacity trigger, so tours and rentals can compete safely.
  for t in select ty.id from public.quad_types ty where ty.active order by ty.id loop
    perform pg_advisory_xact_lock(hashtext('quad:' || t.id));
  end loop;

  -- Take the quads type by type for the whole route.
  v_remaining := p_units;
  for t in
    select ty.id, ty.units from public.quad_types ty where ty.active order by ty.sort_order, ty.id
  loop
    exit when v_remaining = 0;
    select coalesce(max(x.taken), 0) into v_taken
    from (
      select h, (
        select coalesce(sum(al.units), 0)
        from private.quad_rental_allocations al
        where al.quad_type_id = t.id and al.date = p_date and al.status <> 'atsaukta'
          and al.start_hour <= h and h < al.start_hour + al.hours
      ) as taken
      from generate_series(p_start_hour::integer, p_start_hour + r.hours - 1) as h
    ) x;
    v_free := greatest(t.units - v_taken, 0);
    v_use := least(v_free, v_remaining);
    if v_use > 0 then
      v_alloc := v_alloc || jsonb_build_array(jsonb_build_object('quad_type_id', t.id, 'units', v_use));
      v_remaining := v_remaining - v_use;
    end if;
  end loop;
  if v_remaining > 0 then
    raise exception 'Not enough quads free for this tour' using errcode = '23P01', hint = 'quad_full';
  end if;

  v_subtotal := r.price * p_units + v_gear_total;
  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'keturraciai', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  select string_agg((e ->> 'units') || ' × ' || (e ->> 'name'), ', ') into v_gear_text from jsonb_array_elements(v_gear) as e;
  v_note := left(concat_ws(' · ',
    'Turas ' || r.name,
    v_gear_text,
    nullif(btrim(coalesce(p_note, '')), ''),
    case when v_code_id is not null then 'Nuolaidos kodas ' || v_code_text || ' −' || v_code_discount || ' €' end
  ), 300);

  if jsonb_array_length(v_alloc) > 1 then
    -- The deferred header FK lets the capacity trigger see every type when the header is inserted.
    insert into public.quad_rental_items (rental_id, quad_type_id, units)
    select v_id, x.quad_type_id, x.units
    from jsonb_to_recordset(v_alloc) as x(quad_type_id text, units smallint);
  end if;

  return query
  insert into public.quad_rentals (id, quad_type_id, date, start_hour, hours, units, riders,
                                   customer_name, customer_email, customer_phone, total, note,
                                   discount_code_id, discount_code, discount_amount,
                                   tour_route_id, tour_accessories)
  values (v_id,
          case when jsonb_array_length(v_alloc) = 1 then v_alloc -> 0 ->> 'quad_type_id' end,
          p_date, p_start_hour, r.hours, p_units, p_units,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_subtotal - v_code_discount, v_note, v_code_id, v_code_text, v_code_discount,
          r.id, v_gear)
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total, quad_rentals.discount_amount;
end;
$$;

revoke execute on function public.create_quad_tour_rental(text, date, smallint, smallint, jsonb, text, text, text, text, text) from public;
grant execute on function public.create_quad_tour_rental(text, date, smallint, smallint, jsonb, text, text, text, text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Reference data: what the public page showed from constants until now
-- ---------------------------------------------------------------------------

insert into public.quad_tour_routes (id, name, kilometres, hours, duration_label, price, min_units, description, long_description, photo, badge, sort_order) values
  ('mini', 'Mini', 20, 1, 'Iki 1 val.', 59, 3,
   'Trumpas pabėgimas į bekelę. Pirmam kartui ar spontaniškam nuotykiui.',
   'Trumpas turas norintiems per nedaug laiko išbandyti keturratį ir pajusti bekelę. Važiuojant laukia gamtos vaizdai, gaivus oras ir pirmosios nedidelės kliūtys. Tai galimybė susipažinti su keturračio valdymu, įveikti griovius ir aktyviai praleisti valandą. Maršrutą padeda įveikti kartu važiuojantis gidas, todėl galima ramiai mėgautis nauja patirtimi.',
   '/quads/ciongo/mini-route.webp', null, 0),
  ('midi', 'Midi', 35, 2, 'Iki 2 val.', 79, 3,
   'Daugiau miško, posūkių ir laiko įsivažiuoti.',
   'Ilgesnis pasivažinėjimas norintiems daugiau laiko trasoje ir įvairesnių išbandymų. Maršrutas leidžia geriau perprasti keturračio valdymą, išbandyti greičio ruožus ir patirti daugiau bekelės. Kelionę lydi Lietuvos gamtos vaizdai. Turas suderina aktyvų važiavimą su galimybe įsivažiuoti ir per dvi valandas sukaupti daugiau naujų įspūdžių.',
   '/quads/ciongo/midi-route.webp', 'Populiariausia', 1),
  ('maxi', 'Maxi', 50, 3, '2-3 val.', 105, 3,
   'Ilgesnė trasa tiems, kuriems vieno rato per mažai.',
   'Ilgiausias iš šių trijų turų tiems, kurie nori daugiau iššūkių ir ilgesnio pasivažinėjimo. Maršrute dera tiesūs greičio ruožai, skirtingi posūkiai, daubos ir gamtos vaizdai. Daugiau laiko trasoje leidžia geriau pažinti keturračio galimybes, įsitraukti į važiavimą ir patirti įvairesnę bekelę. Kartu visos kelionės metu važiuoja gidas.',
   '/quads/ciongo/maxi-route.webp', null, 2);

insert into public.quad_tour_accessories (id, name, description, price, sort_order) values
  ('posalmis', 'Pošalmis', '', 3, 0),
  ('vienkartinis-kostiumas', 'Vienkartinis kostiumas nuo purvo', '', 5, 1),
  ('kostiumas-nuo-vejo', 'Kostiumas nuo vėjo ir purvo', '', 10, 2);

update public.quad_settings set tour_cancellation_note = 'Nemokamas atšaukimas likus bent 48 val. iki turo.' where id;

comment on table public.quad_tour_routes is 'Guided quad tour products (Mini/Midi/Maxi): price per quad, hours and minimum quads. Booked with create_quad_tour_rental().';
comment on table public.quad_tour_accessories is 'Optional gear sold with a quad tour.';
