-- Live updates in the admin (ADR-0082): the tables whose rows change because of customers, payments and the Stripe
-- webhook are published to Supabase Realtime, so an open admin refreshes its data without a manual reload.
-- Realtime filters every change through row level security with the subscriber's own JWT: only signed-in staff with a
-- SELECT policy on a table receive its changes (anon has none on these, except `events`, which is public anyway).
-- The client only needs to know that something changed, so the default replica identity is enough.

alter publication supabase_realtime add table
  public.bookings,
  public.quad_rentals,
  public.event_tickets,
  public.payments,
  public.coupons,
  public.events,
  public.inquiries,
  public.sauna_blocks,
  public.riders,
  public.purchases,
  public.rider_cards,
  public.rider_sessions,
  public.rider_comments;
