-- Explicit private visibility leaves unpublished drafts out of the public calendar.
alter table public.events
  add column calendar_private boolean not null default false,
  add constraint events_calendar_private_unpublished check (not (published and calendar_private));

create function public.private_event_dates(p_from date, p_to date)
returns table (event_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct e.date
  from public.events e
  where e.calendar_private and not e.published
    and e.date between p_from and p_to
    and e.date between (now() at time zone 'Europe/Vilnius')::date
      and (now() at time zone 'Europe/Vilnius')::date + 59
  order by e.date;
$$;

revoke execute on function public.private_event_dates(date, date) from public;
grant execute on function public.private_event_dates(date, date) to anon, authenticated;
