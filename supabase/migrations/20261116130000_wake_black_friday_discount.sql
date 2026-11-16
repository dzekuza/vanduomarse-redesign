-- The campaign route applies this code automatically. The existing plan-order
-- RPC calculates the actual amount, stores the discount and prices Stripe.
insert into public.discount_codes (code, kind, value, services, note)
values (
  'WAKEBLACKFRIDAY2026', 'procentai', 10, array['planai'],
  'Automatinė WAKE sezono abonemento nuolaida per /registracija/wake/black-friday.'
)
on conflict (code) do nothing;

alter table public.rider_plan_orders add constraint rider_plan_orders_wake_black_friday_check
check (
  discount_code <> 'WAKEBLACKFRIDAY2026' or (
    plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
    and discount_amount = round((price + discount_amount) * 0.10, 2)
  )
);
