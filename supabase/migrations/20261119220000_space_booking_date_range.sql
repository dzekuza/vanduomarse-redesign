-- Space hires can span several days: `date` is the first day, `end_date` the last (inclusive).
-- `start_time` applies to the first day and `end_time` to the last, so a multi-day hire may end earlier in the day than it began.

alter table public.space_bookings add column end_date date;
update public.space_bookings set end_date = date;
alter table public.space_bookings alter column end_date set not null;

alter table public.space_bookings drop constraint space_bookings_times;
alter table public.space_bookings add constraint space_bookings_range check (end_date >= date and (end_date > date or end_time > start_time));
