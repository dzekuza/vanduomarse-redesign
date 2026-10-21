-- Vanduo Marse: row level security.
--
-- Model:
--   * anon / customers: read the public catalogue (settings, upsells, stay
--     types, prices, published events) and call the availability functions.
--     They never read or write bookings, inquiries or tickets directly —
--     public forms go through server actions that validate with Zod and write
--     with the service role (see obsidian/backend/api-architecture.md).
--   * staff: authenticated users listed in public.staff get full access.
--   * service_role bypasses RLS (server actions, admin scripts).

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff s where s.user_id = (select auth.uid()));
$$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.staff enable row level security;
alter table public.sauna_settings enable row level security;
alter table public.sauna_upsells enable row level security;
alter table public.stay_types enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_extras enable row level security;
alter table public.sauna_blocks enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_notes enable row level security;
alter table public.sauna_event_templates enable row level security;
alter table public.events enable row level security;
alter table public.event_tickets enable row level security;
alter table public.price_items enable row level security;

-- Belt and braces: anon has no table privileges on private data at all.
revoke all on public.staff, public.bookings, public.booking_extras, public.sauna_blocks,
  public.inquiries, public.inquiry_notes, public.sauna_event_templates, public.event_tickets
  from anon;
revoke all on sequence public.booking_reference_pm_seq, public.booking_reference_mm_seq,
  public.ticket_reference_seq from anon;

-- ---------------------------------------------------------------------------
-- Staff-only tables
-- ---------------------------------------------------------------------------

create policy "staff read staff" on public.staff
  for select to authenticated using ((select public.is_staff()));

create policy "staff manage bookings" on public.bookings
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage booking extras" on public.booking_extras
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage sauna blocks" on public.sauna_blocks
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage inquiries" on public.inquiries
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage inquiry notes" on public.inquiry_notes
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage sauna event templates" on public.sauna_event_templates
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff manage event tickets" on public.event_tickets
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Public catalogue: everyone reads, staff writes.
-- Separate insert/update/delete policies so select has one policy per role.
-- ---------------------------------------------------------------------------

-- sauna_settings
create policy "public read sauna settings" on public.sauna_settings
  for select to anon, authenticated using (true);
create policy "staff update sauna settings" on public.sauna_settings
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
-- Singleton: no insert/delete policies; the row is seeded by migration.

-- stay_types
create policy "public read stay types" on public.stay_types
  for select to anon, authenticated using (true);
create policy "staff insert stay types" on public.stay_types
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff update stay types" on public.stay_types
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete stay types" on public.stay_types
  for delete to authenticated using ((select public.is_staff()));

-- price_items
create policy "public read price items" on public.price_items
  for select to anon, authenticated using (true);
create policy "staff insert price items" on public.price_items
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff update price items" on public.price_items
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete price items" on public.price_items
  for delete to authenticated using ((select public.is_staff()));

-- sauna_upsells: anon sees active ones; staff also sees inactive ones.
create policy "anon read active upsells" on public.sauna_upsells
  for select to anon using (active);
create policy "authenticated read upsells" on public.sauna_upsells
  for select to authenticated using (active or (select public.is_staff()));
create policy "staff insert upsells" on public.sauna_upsells
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff update upsells" on public.sauna_upsells
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete upsells" on public.sauna_upsells
  for delete to authenticated using ((select public.is_staff()));

-- events: anon sees published ones; staff also sees drafts.
create policy "anon read published events" on public.events
  for select to anon using (published);
create policy "authenticated read events" on public.events
  for select to authenticated using (published or (select public.is_staff()));
create policy "staff insert events" on public.events
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff update events" on public.events
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete events" on public.events
  for delete to authenticated using ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Staff helper: turn the recurring sauna templates into concrete events.
-- Idempotent (unique template_id + date). Runs as the caller, so RLS applies.
-- ---------------------------------------------------------------------------

create function public.materialize_sauna_events(p_from date, p_days integer default 14)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select public.is_staff()) then
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

revoke execute on function public.materialize_sauna_events(date, integer) from public;
grant execute on function public.materialize_sauna_events(date, integer) to authenticated;
