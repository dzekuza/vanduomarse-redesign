-- Vanduo Marse: site-wide switches owners flip from /admin/svetaine.
--
-- First switch: the "coming soon" gate. Until now it was the SITE_GATE env var, which needed a
-- redeploy to change. proxy.ts now reads this row instead (SITE_GATE stays only as the fallback
-- when the database cannot be reached). Singleton row: the primary key can only ever be true.
--
-- Seeded ON: production is gated today, so applying this migration must not open the site.

create table public.site_settings (
  id boolean primary key default true check (id),
  coming_soon boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, coming_soon) values (true, true);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

comment on table public.site_settings is
  'Single-row site switches. coming_soon = the public site shows /netrukus (503). Read by the proxy with the anon key; written by owners only.';

alter table public.site_settings enable row level security;

-- The proxy asks as an anonymous visitor, and the flag is not secret (the 503 page is public).
create policy "anyone reads site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "owner updates site settings" on public.site_settings
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
-- No insert or delete policy: the row exists once and stays.
