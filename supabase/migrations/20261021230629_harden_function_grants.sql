-- Vanduo Marse: tighten function exposure after the first advisor run.
--
-- Supabase grants EXECUTE on new public functions to anon and authenticated
-- directly, so `revoke ... from public` alone left them callable via
-- /rest/v1/rpc. is_staff() moves to a non-exposed schema; everything else
-- that isn't meant to be an RPC loses its anon grant.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Policies reference the function by OID, so they follow it to the new schema.
alter function public.is_staff() set schema private;
revoke execute on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

-- materialize_sauna_events() calls is_staff() by name; recreate it.
create or replace function public.materialize_sauna_events(p_from date, p_days integer default 14)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select private.is_staff()) then
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

revoke execute on function public.materialize_sauna_events(date, integer) from public, anon;
grant execute on function public.materialize_sauna_events(date, integer) to authenticated;

-- Trigger functions: never callable as RPCs.
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.set_booking_reference() from anon, authenticated;
revoke execute on function public.set_ticket_reference() from anon, authenticated;
revoke execute on function public.enforce_sauna_block_free() from anon, authenticated;
revoke execute on function public.enforce_block_not_booked() from anon, authenticated;
revoke execute on function public.enforce_stay_capacity() from anon, authenticated;
revoke execute on function public.enforce_ticket_capacity() from anon, authenticated;
revoke execute on function public.sync_event_sold() from anon, authenticated;

-- Covering index for the composite stay-type foreign key.
create index bookings_stay_type_kind_idx on public.bookings (stay_type_id, kind) where stay_type_id is not null;
