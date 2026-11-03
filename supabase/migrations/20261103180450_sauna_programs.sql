-- Sauna programs: the experiences sold on /rezervacija (Bendra pirtis, Moterų pirtis,
-- Visa šeima, Pirtis tik jūsų kompanijai, ...).
--
--   kind = 'session'  scheduled in `events` (events.program_id), per-person or
--                     adult/child price, seats limited by the event capacity.
--   kind = 'private'  a whole sauna for the group at a flat price and fixed length;
--                     stored as a normal `bookings` row, so it occupies the same
--                     calendar as hourly hire.
--
-- Prices live here and nowhere else; the two RPCs below re-price on the server.

create table public.sauna_programs (
  id text primary key check (id ~ '^[a-z0-9-]+$' and length(id) <= 60),
  name text not null check (length(btrim(name)) between 2 and 60),
  /** Small uppercase line on the card, e.g. "Su pirtininku". */
  label text not null default '' check (length(label) <= 40),
  description text not null default '' check (length(description) <= 240),
  kind text not null check (kind in ('session', 'private')),
  pricing text not null check (pricing in ('person', 'family', 'group')),
  /** Per person (session), per adult (family) or per group (private); EUR incl. 21% PVM. */
  price numeric(10, 2) not null check (price between 0 and 100000),
  /** Per child, family pricing only. */
  child_price numeric(10, 2) check (child_price is null or child_price between 0 and 100000),
  duration_minutes smallint not null check (duration_minutes between 30 and 720),
  /** Private only: most people the program takes. */
  capacity smallint check (capacity is null or capacity between 1 and 100),
  /** Private only: the sauna it occupies. */
  sauna_id text references public.saunas (id) on update cascade on delete restrict,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sauna_programs_session check (kind <> 'session' or (pricing in ('person', 'family') and sauna_id is null and capacity is null)),
  constraint sauna_programs_private check (
    kind <> 'private' or (pricing = 'group' and sauna_id is not null and capacity is not null and duration_minutes % 60 = 0)
  ),
  constraint sauna_programs_family check ((pricing = 'family') = (child_price is not null))
);

comment on table public.sauna_programs is 'Sauna experiences for /rezervacija: scheduled sessions (events.program_id) and flat-price private programs; edited in /admin/pirtis.';

create trigger sauna_programs_updated_at before update on public.sauna_programs
  for each row execute function public.set_updated_at();

alter table public.events
  add column program_id text references public.sauna_programs (id) on update cascade on delete set null;
create index events_program_idx on public.events (program_id) where program_id is not null;

alter table public.bookings
  add column program_id text references public.sauna_programs (id) on update cascade on delete set null;

alter table public.event_tickets
  add column children smallint not null default 0 check (children >= 0 and children <= people);

-- ---------------------------------------------------------------------------
-- RLS (ADR-0012: staff access keyed to the `pirtis` page)
-- ---------------------------------------------------------------------------

alter table public.sauna_programs enable row level security;

create policy "anon read active sauna programs" on public.sauna_programs
  for select to anon using (active);
create policy "pirtis sauna programs read" on public.sauna_programs
  for select to authenticated using (active or (select private.has_any_permission(array['pirtis', 'rezervacijos', 'uzimtumas', 'apzvalga'])));
create policy "pirtis sauna programs insert" on public.sauna_programs
  for insert to authenticated with check ((select private.has_permission('pirtis')));
create policy "pirtis sauna programs update" on public.sauna_programs
  for update to authenticated using ((select private.has_permission('pirtis'))) with check ((select private.has_permission('pirtis')));
create policy "pirtis sauna programs delete" on public.sauna_programs
  for delete to authenticated using ((select private.has_permission('pirtis')));

revoke insert, update, delete, truncate on public.sauna_programs from anon;

-- ---------------------------------------------------------------------------
-- Seats at a program session: adults and children, priced from the program
-- ---------------------------------------------------------------------------

create function public.create_program_ticket(
  p_event_id uuid,
  p_adults smallint,
  p_children smallint,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns table (id uuid, reference text, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  pr public.sauna_programs;
  v_total numeric;
begin
  select * into e from public.events
   where events.id = p_event_id and events.published and events.capacity is not null and events.program_id is not null
     and events.date >= (now() at time zone 'Europe/Vilnius')::date;
  if not found then
    raise exception 'Event unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;
  select * into pr from public.sauna_programs
   where sauna_programs.id = e.program_id and sauna_programs.active and sauna_programs.kind = 'session';
  if not found then
    raise exception 'Program unavailable' using errcode = '23503', hint = 'event_unavailable';
  end if;

  if p_adults < 0 or p_children < 0 or p_adults + p_children < 1 or p_adults + p_children > 20
     or (pr.pricing <> 'family' and p_children > 0) or (pr.pricing = 'family' and p_adults < 1) then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'event_people';
  end if;

  if (select count(*) from public.event_tickets t
       where t.status = 'laukia' and t.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_total := p_adults * pr.price + p_children * coalesce(pr.child_price, pr.price);

  -- The capacity trigger raises 23P01 / event_full when the seats are gone.
  return query
  insert into public.event_tickets (event_id, customer_name, customer_email, customer_phone,
                                    people, children, total, status, source)
  values (e.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_adults + p_children, p_children, v_total, 'laukia', 'svetaine')
  returning event_tickets.id, event_tickets.reference, event_tickets.total;
end;
$$;

revoke execute on function public.create_program_ticket(uuid, smallint, smallint, text, text, text) from public;
grant execute on function public.create_program_ticket(uuid, smallint, smallint, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- A private program: the program's sauna for its fixed length at its flat price
-- ---------------------------------------------------------------------------

create function public.create_program_booking(
  p_program_id text,
  p_date date,
  p_start_hour smallint,
  p_party smallint,
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
  pr public.sauna_programs;
  s public.saunas;
  v_now timestamp := now() at time zone 'Europe/Vilnius';
  v_hours smallint;
  v_note text;
  v_id uuid;
  v_ref text;
begin
  select * into pr from public.sauna_programs
   where sauna_programs.id = p_program_id and sauna_programs.active and sauna_programs.kind = 'private';
  if not found then
    raise exception 'Program unavailable' using errcode = '23503', hint = 'program_unavailable';
  end if;
  select * into s from public.saunas where saunas.id = pr.sauna_id and saunas.active;
  if not found then
    raise exception 'Sauna unavailable' using errcode = '23503', hint = 'sauna_unavailable';
  end if;

  v_hours := (pr.duration_minutes / 60)::smallint;
  if p_start_hour < s.open_hour or p_start_hour + v_hours > s.close_hour then
    raise exception 'Outside opening hours' using errcode = '23514', hint = 'sauna_closed';
  end if;
  if p_party < 1 or p_party > least(pr.capacity, s.max_party) then
    raise exception 'Invalid party size' using errcode = '23514', hint = 'sauna_party';
  end if;
  if p_date < v_now::date or p_date > v_now::date + 120
     or (p_date = v_now::date and p_start_hour <= extract(hour from v_now)::integer) then
    raise exception 'Date is in the past or too far ahead' using errcode = '23514', hint = 'sauna_past';
  end if;

  if (select count(*) from public.bookings b
       where b.status = 'laukia' and b.source = 'svetaine' and b.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many pending requests' using errcode = '54000', hint = 'too_many_requests';
  end if;

  v_note := left(concat_ws(' · ', 'Programa: ' || pr.name, nullif(btrim(coalesce(p_note, '')), '')), 300);

  -- The overlap exclusion constraint raises 23P01 when the sauna is taken.
  insert into public.bookings (kind, sauna_id, program_id, customer_name, customer_email, customer_phone, date,
                               start_hour, hours, guests, total, status, source, note)
  values ('pirtis', s.id, pr.id, btrim(p_name), nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
          p_date, p_start_hour, v_hours, p_party, pr.price, 'laukia', 'svetaine', v_note)
  returning bookings.id, bookings.reference into v_id, v_ref;

  return query select v_id, v_ref, pr.price;
end;
$$;

revoke execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text) from public;
grant execute on function public.create_program_booking(text, date, smallint, smallint, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reference data: the six programs from the client's design. Prices are the
-- design's figures; staff edit them in /admin/pirtis.
-- ---------------------------------------------------------------------------

insert into public.sauna_programs (id, name, label, description, kind, pricing, price, child_price, duration_minutes, capacity, sauna_id, sort_order)
values
  ('bendra-pirtis', 'Bendra pirtis', 'Su pirtininku', 'Pirtininko programa, vanojimas ir arbata. Masažai papildomai.', 'session', 'person', 20.00, null, 150, null, null, 1),
  ('moteru-pirtis', 'Moterų pirtis', 'Su pirtininku', 'Laikas moterų kompanijai. Programa ir arbata įskaičiuota.', 'session', 'person', 20.00, null, 150, null, null, 2),
  ('vyru-pirtis', 'Vyrų pirtis', 'Su pirtininku', 'Vyrų seansas su pirtininko programa ir arbata.', 'session', 'person', 20.00, null, 150, null, null, 3),
  ('visa-seima', 'Visa šeima – į pirtį', 'Švelnesnė programa', 'Lengvesnis seansas su vaikais. 15 € suaugusiajam, 5 € vaikui.', 'session', 'family', 15.00, 5.00, 120, null, null, 4),
  ('pirtis-tik-jusu-kompanijai', 'Pirtis tik jūsų kompanijai', 'Privati nuoma', 'Iki 20 žmonių. Be pirtininko programos.', 'private', 'group', 200.00, null, 180, 20,
     (select s.id from public.saunas s where s.active order by s.sort_order, s.created_at limit 1), 5),
  ('privati-pirtis-su-programa', 'Privati pirtis su programa', 'Su pirtininku', 'Jūsų kompanija, pirtininko programa ir arbata. Masažai papildomai.', 'private', 'group', 350.00, null, 180, 20,
     (select s.id from public.saunas s where s.active order by s.sort_order, s.created_at limit 1), 6);
