-- A mixed fleet request has one header and one allocation per selected type.
-- Existing single-type requests still carry their allocation on the header.
alter table public.quad_rentals alter column quad_type_id drop not null;

create table public.quad_rental_items (
  rental_id uuid not null references public.quad_rentals (id) on delete cascade deferrable initially deferred,
  quad_type_id text not null references public.quad_types (id) on update cascade on delete restrict,
  units smallint not null check (units between 1 and 20),
  primary key (rental_id, quad_type_id)
);

create index quad_rental_items_type_idx on public.quad_rental_items (quad_type_id);
alter table public.quad_rental_items enable row level security;
revoke all on public.quad_rental_items from public, anon, authenticated;
grant select on public.quad_rental_items to authenticated;
create policy "keturraciai quad rental items" on public.quad_rental_items
  for select to authenticated using ((select private.has_permission('keturraciai')));

-- This private projection is the single source for checking and reading occupancy.
create view private.quad_rental_allocations as
  select r.id as rental_id, r.quad_type_id, r.units, r.date, r.start_hour, r.hours, r.status
  from public.quad_rentals r
  where r.quad_type_id is not null
  union all
  select r.id, i.quad_type_id, i.units, r.date, r.start_hour, r.hours, r.status
  from public.quad_rentals r
  join public.quad_rental_items i on i.rental_id = r.id
  where r.quad_type_id is null;

revoke all on private.quad_rental_allocations from public, anon, authenticated;

create or replace function public.enforce_quad_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_item_count integer;
  v_item_units integer;
  v_stock smallint;
  v_full integer;
begin
  select count(*), coalesce(sum(i.units), 0) into v_item_count, v_item_units
  from public.quad_rental_items i where i.rental_id = new.id;
  if (new.quad_type_id is null and (v_item_count < 2 or v_item_units <> new.units))
     or (new.quad_type_id is not null and v_item_count <> 0) then
    raise exception 'Invalid quad rental allocations' using errcode = '23514', hint = 'quad_units';
  end if;
  if new.status = 'atsaukta' then
    return new;
  end if;

  -- Every mixed request locks its types in the same order. The single-type
  -- path uses the same locks, so either kind can safely compete for stock.
  for v_item in
    select i.quad_type_id, i.units from public.quad_rental_items i where i.rental_id = new.id
    union all
    select new.quad_type_id, new.units where new.quad_type_id is not null
    order by quad_type_id
  loop
    perform pg_advisory_xact_lock(hashtext('quad:' || v_item.quad_type_id));
    select t.units into v_stock from public.quad_types t where t.id = v_item.quad_type_id;
    if v_item.units > coalesce(v_stock, 0) then
      raise exception 'Only % of % exist', coalesce(v_stock, 0), v_item.quad_type_id
        using errcode = '23P01', hint = 'quad_full';
    end if;

    select h into v_full
    from generate_series(new.start_hour, new.start_hour + new.hours - 1) as h
    where (
      select coalesce(sum(a.units), 0)
      from private.quad_rental_allocations a
      where a.quad_type_id = v_item.quad_type_id
        and a.date = new.date
        and a.status <> 'atsaukta'
        and a.rental_id <> new.id
        and a.start_hour <= h
        and h < a.start_hour + a.hours
    ) + v_item.units > v_stock
    order by h
    limit 1;

    if found then
      raise exception 'Not enough % free at %:00 on %', v_item.quad_type_id, v_full, new.date
        using errcode = '23P01', hint = 'quad_full';
    end if;
  end loop;
  return new;
end;
$$;

create or replace function public.quad_taken(p_from date, p_to date)
returns table (day date, hour smallint, quad_type_id text, taken integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_to < p_from or p_to - p_from > 60 then
    raise exception 'Range must be 0-60 days' using errcode = '22023';
  end if;

  return query
    select a.date, h::smallint, a.quad_type_id, sum(a.units)::integer
    from private.quad_rental_allocations a
    cross join lateral generate_series(a.start_hour, a.start_hour + a.hours - 1) as h
    where a.status <> 'atsaukta' and a.date between p_from and p_to
    group by a.date, h, a.quad_type_id
    order by a.date, h;
end;
$$;

create function public.create_mixed_quad_rental(
  p_allocations jsonb,
  p_date date,
  p_start_hour smallint,
  p_hours smallint,
  p_riders smallint,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_note text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.quad_settings;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_id uuid := gen_random_uuid();
  v_count integer;
  v_types integer;
  v_units integer;
  v_seats integer;
  v_hourly_total numeric;
begin
  -- The same 20-unit limit as single-type rentals and MAX_QUAD_RENTAL_UNITS.
  if jsonb_typeof(p_allocations) is distinct from 'array' then
    raise exception 'Allocations must be an array' using errcode = '23514', hint = 'quad_units';
  end if;
  v_count := jsonb_array_length(p_allocations);
  if v_count not between 2 and 20 or exists (
    select 1 from jsonb_array_elements(p_allocations) as a
    where jsonb_typeof(a -> 'quad_type_id') is distinct from 'string'
       or (a ->> 'quad_type_id') !~ '^[a-z0-9-]{1,60}$'
       or jsonb_typeof(a -> 'units') is distinct from 'number'
       or (a ->> 'units') !~ '^([1-9]|1[0-9]|20)$'
  ) then
    raise exception 'Invalid quad rental allocations' using errcode = '23514', hint = 'quad_units';
  end if;

  select count(distinct a.quad_type_id), sum(a.units) into v_types, v_units
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint);
  if v_types <> v_count or v_units > 20 then
    raise exception 'Duplicate types or too many units' using errcode = '23514', hint = 'quad_units';
  end if;

  select count(*), sum(t.seats * a.units), sum(t.price_per_hour * a.units)
  into v_types, v_seats, v_hourly_total
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint)
  join public.quad_types t on t.id = a.quad_type_id and t.active;
  if v_types <> v_count then
    raise exception 'Quad type unavailable' using errcode = '23503', hint = 'quad_unavailable';
  end if;
  if p_riders is null or p_riders < 1 or p_riders > v_seats then
    raise exception 'Too many riders for the chosen quads' using errcode = '23514', hint = 'quad_riders';
  end if;

  select * into s from public.quad_settings where quad_settings.id;
  if not found or p_hours is null or p_start_hour is null
     or p_hours < 1 or p_hours > s.max_hours or p_start_hour < s.open_hour or p_start_hour + p_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'quad_closed';
  end if;
  if p_date is null or p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'quad_past';
  end if;
  if (select count(*) from public.quad_rentals r
       where r.status = 'laukia' and r.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  -- The deferred header FK lets the existing capacity trigger see all types
  -- when the header is inserted. Any failure rolls the allocations back too.
  insert into public.quad_rental_items (rental_id, quad_type_id, units)
  select v_id, a.quad_type_id, a.units
  from jsonb_to_recordset(p_allocations) as a(quad_type_id text, units smallint);

  return query
  insert into public.quad_rentals (id, date, start_hour, hours, units, riders,
                                   customer_name, customer_email, customer_phone, total, note)
  values (v_id, p_date, p_start_hour, p_hours, v_units, p_riders,
          btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_hours * v_hourly_total, nullif(btrim(coalesce(p_note, '')), ''))
  returning quad_rentals.id, quad_rentals.reference, quad_rentals.total;
end;
$$;

revoke execute on function public.create_mixed_quad_rental(jsonb, date, smallint, smallint, smallint, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_mixed_quad_rental(jsonb, date, smallint, smallint, smallint, text, text, text, text)
  to anon, authenticated;
