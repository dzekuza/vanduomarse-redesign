-- Vanduo Marse: editable service page content (/admin/puslapiai, owners only).
--
-- One row per public service page (pirtis, vandenlentes, nakvyne, ...). `content` holds only the fields
-- the owner changed (title, summary, description, facts, questions, photos, ...); anything missing falls
-- back to the defaults in code (components/services/service-content.ts), so an empty row changes nothing.
-- Photos live in the public `page-photos` bucket; owners upload and remove them.

create table public.page_content (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,60}$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);

create trigger page_content_updated_at before update on public.page_content
  for each row execute function public.set_updated_at();

comment on table public.page_content is
  'Owner overrides for public service pages, keyed by slug. Only changed fields are stored; the rest come from code defaults.';

alter table public.page_content enable row level security;

create policy "anyone reads page content" on public.page_content
  for select to anon, authenticated using (true);
create policy "owner inserts page content" on public.page_content
  for insert to authenticated with check ((select private.is_owner()));
create policy "owner updates page content" on public.page_content
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner deletes page content" on public.page_content
  for delete to authenticated using ((select private.is_owner()));

revoke all on public.page_content from anon;
grant select on public.page_content to anon;
revoke truncate, references, trigger on public.page_content from authenticated;

-- ---------------------------------------------------------------------------
-- Photos: public bucket, owners upload and remove
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('page-photos', 'page-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "owner page photos read" on storage.objects
  for select to authenticated using (bucket_id = 'page-photos' and (select private.is_owner()));
create policy "owner page photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'page-photos' and (select private.is_owner()));
create policy "owner page photos update" on storage.objects
  for update to authenticated using (bucket_id = 'page-photos' and (select private.is_owner()))
  with check (bucket_id = 'page-photos' and (select private.is_owner()));
create policy "owner page photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'page-photos' and (select private.is_owner()));
