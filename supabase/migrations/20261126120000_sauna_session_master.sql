-- Optional sauna master (pirtininkas) on a public sauna session (events.category = 'pirtis').
-- Additive: a nullable column; null = "Be pirtininko". Deleting a master leaves the session without one.

alter table public.events
  add column sauna_master_id text references public.sauna_masters (id) on delete set null;

comment on column public.events.sauna_master_id is 'Sauna master leading this public sauna session; null = none. Only used for category pirtis.';

create index events_sauna_master_idx on public.events (sauna_master_id) where sauna_master_id is not null;
