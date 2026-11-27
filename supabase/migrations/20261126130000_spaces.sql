-- Event spaces (erdvės) as data (ADR-0129). Seeded from the hardcoded list in lib/event-pricing.ts with the same ids,
-- so every existing space_bookings row stays valid. The admin "Erdvės" page edits names, rent and the active switch;
-- the staff booking flow and the calendar read this table. The public price calculator keeps the price sheet.
--
-- space_bookings.spaces had a CHECK listing the eight ids; it is replaced by a trigger that checks every id against
-- this table, so a new space can be hired without another migration. Spaces cannot be deleted (no delete policy),
-- only switched off, so a booking never points at a missing space.

create table public.spaces (
  id text primary key check (id ~ '^[a-z0-9-]+$' and length(id) <= 60),
  label text not null check (length(trim(label)) between 2 and 80),
  blurb text not null default '' check (length(blurb) <= 300),
  max_guests integer not null check (max_guests between 1 and 5000),
  -- Rent incl. PVM; null = not offered that day type. Evening hires use the weekend price (as the price sheet does).
  price_weekday numeric(10, 2) check (price_weekday >= 0),
  price_weekend numeric(10, 2) check (price_weekend >= 0),
  -- Hiring it takes every other space (the whole park).
  whole_park boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.spaces is 'Event spaces staff hire out (space_bookings.spaces holds these ids). Edited at /admin/erdves.';

create trigger spaces_updated_at before update on public.spaces
  for each row execute function public.set_updated_at();

alter table public.spaces enable row level security;

create policy "rezervacijos spaces read" on public.spaces
  for select to authenticated
  using ((select private.has_any_permission(array['rezervacijos', 'uzimtumas', 'apzvalga', 'kainos'])));
create policy "rezervacijos spaces insert" on public.spaces
  for insert to authenticated
  with check ((select private.has_any_permission(array['rezervacijos', 'kainos'])));
create policy "rezervacijos spaces update" on public.spaces
  for update to authenticated
  using ((select private.has_any_permission(array['rezervacijos', 'kainos'])))
  with check ((select private.has_any_permission(array['rezervacijos', 'kainos'])));

grant select, insert, update on public.spaces to authenticated;

insert into public.spaces (id, label, blurb, max_guests, price_weekday, price_weekend, whole_park, sort_order) values
  ('terasa', 'Įstiklinta terasa', 'Šildoma terasa, staliukai, apšvietimas. Nuomos mokesčio nėra, tik minimali sąskaita.', 30, 0, 0, false, 0),
  ('kupolas-svente', 'Kupolas: šventė', 'Šildomas kupolas su scena ir vieta didžėjui.', 250, 700, 700, false, 1),
  ('kupolas-seminaras', 'Kupolas: seminaras', 'Konferencinis išdėstymas. I–V, 9:00–15:00.', 250, 363, null, false, 2),
  ('kupolas-corona', 'Kupolas + „Corona“', 'Kupolas, baseino zona, lauko baras, WC, DJ erdvė. Populiariausias vestuvių paketas.', 500, 1900, 1900, false, 3),
  ('corona', '„Corona“ su baseinu', 'Privatus baseinas, atskiras baras, minkštasuoliai, DJ zona. Visiškas privatumas.', 250, 1200, 1200, false, 4),
  ('restoranas', 'Restoranas + terasa', 'Vidaus salė ir šildoma terasa, baldai, aptarnavimas.', 45, 500, 500, false, 5),
  ('parkas', 'Visas parkas (be WAKE)', 'Visos erdvės, scena ir teritorija be vandenlenčių trasos.', 500, 6000, 7000, true, 6),
  ('parkas-wake', 'Visas parkas su WAKE', 'Visos erdvės ir neribotas vandenlenčių parkas su instruktoriais ir įranga.', 500, 9000, 10000, true, 7);

-- Every hired space must exist in public.spaces.
create function private.check_space_booking_spaces()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if cardinality(new.spaces) < 1 then
    raise exception 'A space booking needs at least one space' using errcode = '23514', hint = 'space_unknown';
  end if;
  if exists (select 1 from unnest(new.spaces) as s(id) where not exists (select 1 from public.spaces p where p.id = s.id)) then
    raise exception 'Unknown space in %', new.spaces using errcode = '23514', hint = 'space_unknown';
  end if;
  return new;
end;
$$;

create trigger space_bookings_spaces_known
  before insert or update of spaces on public.space_bookings
  for each row execute function private.check_space_booking_spaces();

alter table public.space_bookings drop constraint space_bookings_spaces;
