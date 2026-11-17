-- Vanduo Marse: bulk rider import from the legacy Grabby customer list.
--
-- Imported contacts have no Vanduo Marse plan yet — they're just people, not
-- a sale — so riders.plan_id (previously "the plan they're currently on",
-- mandatory) can no longer be required. A grabby_id lets the importer upsert
-- safely: rerunning the import updates contact details instead of
-- duplicating riders.

alter table public.riders alter column plan_id drop not null;

alter table public.riders
  add column grabby_id text unique check (grabby_id is null or char_length(grabby_id) <= 60);
