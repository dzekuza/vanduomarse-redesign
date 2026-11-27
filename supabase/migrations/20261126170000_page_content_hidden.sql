-- Vanduo Marse: owners can switch a public service page off (/admin/puslapiai, ADR-0137).
--
-- A hidden page answers 404 and is left out of the header and menu, the home page activity tiles, the footer,
-- /kainos and the sitemap. The flag lives on the page's `page_content` row; a row may now exist with an empty
-- `content` just to carry `hidden = true`. Existing RLS (anyone reads, owners write) covers the new column.

alter table public.page_content
  add column hidden boolean not null default false;

comment on column public.page_content.hidden is
  'True when the owner switched the service page off: the page 404s and every public link to it is left out.';
