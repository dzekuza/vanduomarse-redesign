-- !!! NOT APPLIED TO THE LIVE DATABASE. Needs the owner's go-ahead (PR description, ADR-0128). !!!
--
-- Nested seasons (ADR-0128): replaces the "no overlapping seasons" exclusion constraint with "no two seasons of one
-- type with the very same dates". Pricing already takes the shortest season of a night (20261126100000), and the app
-- refuses ranges that cross without one containing the other, so the database only has to stop exact duplicates.
-- Until this runs, saving a season inside another fails with 23P01 and the admin shows a message saying so.
--
-- Rollback: delete the overlapping rows, then re-add stay_type_seasons_no_overlap as in 20261124120000.

alter table public.stay_type_seasons drop constraint stay_type_seasons_no_overlap;

alter table public.stay_type_seasons
  add constraint stay_type_seasons_unique_range unique (stay_type_id, starts_on, ends_on);
