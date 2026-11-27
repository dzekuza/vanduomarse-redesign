-- Vanduo Marse: the WAKE Black Friday code may carry any percentage the owner sets in /admin/nuolaidos.
--
-- 20261116174211 (rider_plan_orders) and 20261117180903 (plan_passes) pinned the discount to exactly 10 % in a check
-- constraint. PR #163 made the pages follow the live percentage, so when the owner changed the code to 20 % on
-- 2026-11-27 every Black Friday pass purchase failed with 23514 ("Nepavyko pradėti mokėjimo"). The server already
-- prices the discount from discount_codes, so the database now only keeps the rule that the code is for the WAKE
-- season pass.

alter table public.plan_passes drop constraint plan_passes_wake_black_friday_check;
alter table public.plan_passes add constraint plan_passes_wake_black_friday_check check (
  discount_code is distinct from 'WAKEBLACKFRIDAY2026'
  or plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
);

alter table public.rider_plan_orders drop constraint rider_plan_orders_wake_black_friday_check;
alter table public.rider_plan_orders add constraint rider_plan_orders_wake_black_friday_check check (
  discount_code <> 'WAKEBLACKFRIDAY2026'
  or plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
);
