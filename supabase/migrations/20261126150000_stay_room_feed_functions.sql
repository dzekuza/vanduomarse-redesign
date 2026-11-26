-- The two ways in to the outbound room calendars (ADR-0130), so no app code reads the token or assignment tables.
-- Additive: two new functions.

-- Service role (the /api/ical/room/<token> route): the room and its exported bookings, after assigning new ones.
-- Null for an unknown token. Only booking ids, references and dates: no guest details leave the database.
create function public.stay_room_feed(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calendar uuid;
  v_label text;
  v_active boolean;
begin
  select c.id, c.label, c.active into v_calendar, v_label, v_active
  from public.external_calendar_exports e
  join public.external_calendars c on c.id = e.calendar_id
  where e.token = p_token;
  if v_calendar is null then
    return null;
  end if;

  perform public.assign_stay_rooms();

  return jsonb_build_object(
    'room', v_label,
    'active', v_active,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'booking_id', a.booking_id,
        'unit', a.unit,
        'reference', k.reference,
        'starts_on', a.starts_on,
        'nights', a.nights,
        'updated_at', greatest(k.updated_at, a.created_at)
      ) order by a.starts_on, a.booking_id, a.unit)
      from public.stay_room_assignments a
      join public.bookings k on k.id = a.booking_id
      where a.calendar_id = v_calendar
        and k.status in ('patvirtinta', 'ivykdyta')
        and a.starts_on = k.date and a.nights = k.nights
        and a.starts_on + a.nights >= current_date
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.stay_room_feed is 'Service role: one Sirvoy room''s outbound iCal content (our confirmed bookings assigned to it), by its secret token.';

revoke all on function public.stay_room_feed(text) from public, anon, authenticated;
grant execute on function public.stay_room_feed(text) to service_role;

-- Owner: each room's export token, to show the addresses to paste into Sirvoy.
create function public.stay_room_export_links()
returns table (calendar_id uuid, label text, stay_type_id text, token text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Owner only' using errcode = '42501';
  end if;
  return query
    select c.id, c.label, c.stay_type_id, e.token
    from public.external_calendars c
    join public.external_calendar_exports e on e.calendar_id = c.id
    order by case when c.label ~ '^\d+$' then c.label::integer end nulls last, c.label;
end;
$$;

comment on function public.stay_room_export_links is 'Owner: the secret token of each room''s outbound iCal feed.';

revoke all on function public.stay_room_export_links() from public, anon;
grant execute on function public.stay_room_export_links() to authenticated;
