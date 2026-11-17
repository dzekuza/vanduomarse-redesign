-- A request recorded as paid at entry has both a time and a method, or neither (review of ADR-0112). Existing rows have
-- neither, so the constraints are valid from the start.
alter table public.bookings add constraint bookings_paid_pair_check check ((paid_at is null) = (payment_method is null));
alter table public.event_tickets add constraint event_tickets_paid_pair_check check ((paid_at is null) = (payment_method is null));
alter table public.quad_rentals add constraint quad_rentals_paid_pair_check check ((paid_at is null) = (payment_method is null));
