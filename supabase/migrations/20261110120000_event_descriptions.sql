alter table public.events
  add column description text
  constraint events_description_length check (char_length(description) <= 5000);

comment on column public.events.description is
  'Optional full public session description. The short blurb remains the listing summary.';
