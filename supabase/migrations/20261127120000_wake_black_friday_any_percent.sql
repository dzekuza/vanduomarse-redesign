-- Vanduo Marse: the Black Friday WAKE code may carry any percentage the owner sets in /admin/nuolaidos.
--
-- The checks from 20261116174211 / 20261117180903 pinned the discount at exactly 10 % of the WAKE season pass. When the
-- owner raised the code to 20 % on 2026-11-27, every Black Friday order (pass or member plan order) failed this check
-- on insert. The amount itself is computed by private.apply_discount_code from the live code row; the checks now only
-- keep the code on the WAKE season pass.

alter table public.plan_passes drop constraint plan_passes_wake_black_friday_check;
alter table public.plan_passes add constraint plan_passes_wake_black_friday_check check (
  discount_code is distinct from 'WAKEBLACKFRIDAY2026' or plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
);

alter table public.rider_plan_orders drop constraint rider_plan_orders_wake_black_friday_check;
alter table public.rider_plan_orders add constraint rider_plan_orders_wake_black_friday_check check (
  discount_code is distinct from 'WAKEBLACKFRIDAY2026' or plan_id = '52e95927-7591-4feb-99b4-1b92c878ca6c'::uuid
);
