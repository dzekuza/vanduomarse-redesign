-- site_settings: least privilege on top of RLS. The proxy only reads (anon), owners only update
-- (authenticated); nobody inserts or deletes (the row is seeded once), matching 20261111174736_security_hardening.sql.
revoke all on public.site_settings from anon;
grant select on public.site_settings to anon;
revoke insert, delete, truncate, references, trigger on public.site_settings from authenticated;
