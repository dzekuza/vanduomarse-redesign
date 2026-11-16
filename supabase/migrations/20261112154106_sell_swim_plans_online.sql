-- The WAKE page lists the swim plans from `ride_plans` (category Plaukimas) next to the season passes (ADR-0080),
-- bought the same way: register, pay with Stripe Checkout, the webhook attaches the plan.
-- "Papildoma valanda" is an add-on to a ticket the rider already has, so it stays till-only.
update public.ride_plans
   set sold_online = true
 where category = 'Plaukimas' and active and price is not null and price > 0 and name <> 'Papildoma valanda';
