-- Vanduo Marse: the CIONGO quad tour rules agreed with the owner (2026-11-27).
--
-- * One tour only: the Midi route. Mini and Maxi are switched off (kept for history and old requests).
-- * Price per quad 80 €; from 10 quads every quad costs 72 € (10 % off).
-- * At most 15 customer quads per tour (was 20).
-- * From 11 customer quads two guides ride along on two more quads from the same fleet. Those quads are held in
--   the stock like any other (quad_rentals.units = customer quads + guide quads) and recorded in guide_units, so
--   the customer quads are units - guide_units (also stored as riders for tours).

alter table public.quad_tour_routes
  add column max_units smallint not null default 15 check (max_units between 1 and 40),
  add column group_from smallint check (group_from between 2 and 40),
  add column group_price numeric(10, 2) check (group_price > 0),
  add column guides_from smallint check (guides_from between 2 and 40),
  add column guide_units smallint not null default 0 check (guide_units between 0 and 5),
  add constraint quad_tour_routes_group_pair check ((group_from is null) = (group_price is null)),
  add constraint quad_tour_routes_min_max check (min_units <= max_units);

comment on column public.quad_tour_routes.max_units is 'Most customer quads one tour booking can take.';
comment on column public.quad_tour_routes.group_from is 'From this many quads every quad costs group_price instead of price.';
comment on column public.quad_tour_routes.guides_from is 'From this many customer quads the tour also takes guide_units quads for its guides.';

alter table public.quad_rentals
  add column guide_units smallint not null default 0 check (guide_units >= 0);
alter table public.quad_rentals add constraint quad_rentals_guide_units_lt_units check (guide_units < units);
comment on column public.quad_rentals.guide_units is 'Quads of this rental ridden by guides (tours of 11+ quads); included in units.';

update public.quad_tour_routes
set price = 80, group_from = 10, group_price = 72, max_units = 15, guides_from = 11, guide_units = 2,
    min_units = least(min_units, 15), badge = null
where id = 'midi';
update public.quad_tour_routes set active = false where id in ('mini', 'maxi');

create or replace function public.create_quad_tour_rental(p_route_id text, p_date date, p_start_hour smallint, p_units smallint, p_accessories jsonb, p_name text, p_email text default null::text, p_phone text default null::text, p_note text default null::text, p_discount_code text default null::text)
returns table(id uuid, reference text, total numeric, code_discount numeric)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r public.quad_tour_routes;
  s public.quad_settings;
  t record;
  a record;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_id uuid := gen_random_uuid();
  v_guides integer;
  v_unit_price numeric;
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
  if p_units is null or p_units < r.min_units or p_units > r.max_units then
    raise exception 'Invalid number of quads for this tour' using errcode = '23514', hint = 'quad_units';
  end if;
  v_guides := case when r.guides_from is not null and p_units >= r.guides_from then r.guide_units else 0 end;
  v_unit_price := case when r.group_from is not null and p_units >= r.group_from then r.group_price else r.price end;

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
  -- At most two items of gear per customer quad, like the form.
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

  -- Take the quads (customers' and guides') type by type for the whole route.
  v_remaining := p_units + v_guides;
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

  v_subtotal := v_unit_price * p_units + v_gear_total;
  select dc.code_id, dc.code, dc.amount into v_code_id, v_code_text, v_code_discount
  from private.apply_discount_code(p_discount_code, 'keturraciai', v_subtotal) dc;
  v_code_discount := coalesce(v_code_discount, 0);

  select string_agg((e ->> 'units') || ' × ' || (e ->> 'name'), ', ') into v_gear_text from jsonb_array_elements(v_gear) as e;
  v_note := left(concat_ws(' · ',
    'Turas ' || r.name,
    case when v_guides > 0 then 'Su ' || v_guides || ' vedliais (+' || v_guides || ' keturr.)' end,
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
  insert into public.quad_rentals (id, quad_type_id, date, start_hour, hours, units, riders, guide_units,
                                   customer_name, customer_email, customer_phone, total, note,
                                   discount_code_id, discount_code, discount_amount,
                                   tour_route_id, tour_accessories)
  values (v_id,
          case when jsonb_array_length(v_alloc) = 1 then v_alloc -> 0 ->> 'quad_type_id' end,
          p_date, p_start_hour, r.hours, p_units + v_guides, p_units, v_guides,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          v_subtotal - v_code_discount, v_note, v_code_id, v_code_text, v_code_discount,
          r.id, v_gear)
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total, quad_rentals.discount_amount;
end;
$function$;
