-- Saving a stay type and its seasons in one transaction (ADR-0126, review of PR #154).
--
-- Before, the app upserted the type, then deleted and upserted the seasons in separate calls, so an
-- overlap error left the type changed and the old seasons gone. This function does all of it or nothing.
-- It runs as the caller (security invoker): the owner-only RLS policies on stay_types and
-- stay_type_seasons still decide who may call it. A season id that already belongs to another type
-- fails on the primary key, so a stale or forged request cannot move pricing between types.

create function public.save_stay_type(p_type jsonb, p_seasons jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id text := p_type ->> 'id';
begin
  insert into public.stay_types (id, kind, label, note, max_guests, price_per_night, price_per_night_2, price_per_night_3, units, active, sort_order)
  values (
    v_id,
    (p_type ->> 'kind')::public.booking_kind,
    p_type ->> 'label',
    coalesce(p_type ->> 'note', ''),
    (p_type ->> 'max_guests')::integer,
    (p_type ->> 'price_per_night')::numeric,
    (p_type ->> 'price_per_night_2')::numeric,
    (p_type ->> 'price_per_night_3')::numeric,
    (p_type ->> 'units')::integer,
    (p_type ->> 'active')::boolean,
    (p_type ->> 'sort_order')::integer
  )
  on conflict (id) do update set
    kind = excluded.kind,
    label = excluded.label,
    note = excluded.note,
    max_guests = excluded.max_guests,
    price_per_night = excluded.price_per_night,
    price_per_night_2 = excluded.price_per_night_2,
    price_per_night_3 = excluded.price_per_night_3,
    units = excluded.units,
    active = excluded.active,
    sort_order = excluded.sort_order,
    updated_at = now();

  -- Replace the whole set: no overlap can appear halfway through.
  delete from public.stay_type_seasons where stay_type_id = v_id;
  insert into public.stay_type_seasons (id, stay_type_id, starts_on, ends_on, price_per_night, price_per_night_2, price_per_night_3)
  select x.id, v_id, x.starts_on, x.ends_on, x.price_per_night, x.price_per_night_2, x.price_per_night_3
  from jsonb_to_recordset(coalesce(p_seasons, '[]'::jsonb)) as x(
    id uuid, starts_on date, ends_on date, price_per_night numeric, price_per_night_2 numeric, price_per_night_3 numeric
  );
end;
$$;

comment on function public.save_stay_type is 'Owner: upserts a stay type and replaces its seasons atomically (security invoker, so owner-only RLS applies).';

revoke all on function public.save_stay_type(jsonb, jsonb) from public, anon;
grant execute on function public.save_stay_type(jsonb, jsonb) to authenticated;
