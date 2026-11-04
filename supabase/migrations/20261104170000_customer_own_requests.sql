-- A signed-in customer can read their own requests and payments (the /paskyra page, ADR-0027).
-- These are extra permissive policies next to the staff ones: staff still see everything through
-- their page permissions, a customer sees only rows whose user_id is their own account. No write
-- access is added.

create policy "customers read own bookings" on public.bookings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "customers read own quad rentals" on public.quad_rentals
  for select to authenticated using (user_id = (select auth.uid()));

create policy "customers read own event tickets" on public.event_tickets
  for select to authenticated using (user_id = (select auth.uid()));

create policy "customers read own quad rental items" on public.quad_rental_items
  for select to authenticated
  using (exists (select 1 from public.quad_rentals r where r.id = rental_id and r.user_id = (select auth.uid())));

create policy "customers read own payments" on public.payments
  for select to authenticated using (user_id = (select auth.uid()));
