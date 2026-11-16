-- Sale price for events and sauna sessions (ADR-0104).
-- `price` stays what a ticket costs: every ticket and checkout function already charges it.
-- `regular_price` is the pre-sale price, shown struck through next to `price`; null = no sale.
alter table public.events
  add column regular_price numeric(10, 2);

alter table public.events
  add constraint events_regular_price_above_price
  check (regular_price is null or (price is not null and regular_price > price));

comment on column public.events.regular_price is
  'Pre-sale price shown struck through; null = no sale. price is what tickets cost.';
