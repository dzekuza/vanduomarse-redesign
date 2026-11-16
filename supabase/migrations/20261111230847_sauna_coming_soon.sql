-- Vanduo Marse: a sauna can be announced before it opens.
--
-- `coming_soon` saunas are shown on /pirtis with "Netrukus atsidarys" but cannot
-- be booked. Booking, pricing and the event calculator keep reading `active`
-- only, so a coming-soon sauna is `active = false, coming_soon = true`.
-- Visitors may read the row; the policy is the only thing that changes for them.

alter table public.saunas
  add column coming_soon boolean not null default false,
  add constraint saunas_coming_soon_inactive check (not (active and coming_soon));

comment on column public.saunas.coming_soon is 'Shown to visitors as "Netrukus atsidarys" but not bookable; always with active = false.';

drop policy "anon read active saunas" on public.saunas;
create policy "anon read active saunas" on public.saunas
  for select to anon using (active or coming_soon);

drop policy "pirtis saunas read" on public.saunas;
create policy "pirtis saunas read" on public.saunas
  for select to authenticated using (active or coming_soon or (select private.has_any_permission(array['pirtis', 'rezervacijos', 'uzimtumas', 'apzvalga'])));
