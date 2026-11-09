-- Remove the unused "laimeta"/"prarasta" (won/lost) inquiry statuses (ADR-0047).
-- Confirmed no row currently uses either value (`select status, count(*) from
-- public.inquiries group by status` → only "nauja"), so this is a plain
-- enum-narrowing swap, not a data migration. Guarded so a replay against an
-- already-migrated database (this one — applied via execute_sql first, then
-- registered here) is a no-op.

do $$
begin
  if exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'inquiry_status' and e.enumlabel = 'laimeta'
  ) then
    alter type public.inquiry_status rename to inquiry_status_old;
    create type public.inquiry_status as enum ('nauja', 'susisiekta', 'pasiulymas');
    alter table public.inquiries
      alter column status drop default,
      alter column status type public.inquiry_status using status::text::public.inquiry_status,
      alter column status set default 'nauja';
    drop type public.inquiry_status_old;
  end if;
end $$;
