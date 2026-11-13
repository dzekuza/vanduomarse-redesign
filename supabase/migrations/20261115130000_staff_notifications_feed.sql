-- Vanduo Marse: the admin notification bell (ADR-0088).
--
-- `staff_notifications` is the feed behind the bell in the admin header: one row per event staff are told about
-- (a new request, a payment, a payment to check, a double payment, a customer cancellation, a paid coupon or plan).
-- The server writes it next to the SMS / e-mail / push it already sends (service role only, no insert policy). A row
-- says which admin pages' permissions may see it (`permissions`): a staff member sees a row when their role has any of
-- them (owners see everything). The table is in Supabase Realtime, so an open admin shows new rows as they arrive.
--
-- `staff_notification_reads` keeps, per staff member, the moment they last opened the bell: newer rows are "new".

create table public.staff_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('uzklausa', 'mokejimas', 'mokejimas_patikrinti', 'dvigubas', 'atsaukta')),
  -- Admin page permissions (see lib/admin/permissions.ts) whose holders may see this row.
  permissions text[] not null check (cardinality(permissions) >= 1),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 1000),
  reference text,
  -- Where the row leads inside the admin.
  href text not null default '/admin' check (href like '/admin%'),
  created_at timestamptz not null default now()
);

create index staff_notifications_created_idx on public.staff_notifications (created_at desc);

comment on table public.staff_notifications is
  'Feed behind the admin notification bell. Written by the server (service role); staff read the rows their role permissions allow.';

alter table public.staff_notifications enable row level security;

create policy "staff read notifications they may see" on public.staff_notifications
  for select to authenticated
  using ((select private.is_staff()) and exists (select 1 from unnest(permissions) p where (select private.has_permission(p))));

revoke all on public.staff_notifications from anon, authenticated;
grant select on public.staff_notifications to authenticated;

create table public.staff_notification_reads (
  user_id uuid primary key references public.staff (user_id) on delete cascade,
  read_at timestamptz not null default now()
);

alter table public.staff_notification_reads enable row level security;

create policy "staff read own notification marker" on public.staff_notification_reads
  for select to authenticated using (user_id = (select auth.uid()) and (select private.is_staff()));
create policy "staff insert own notification marker" on public.staff_notification_reads
  for insert to authenticated with check (user_id = (select auth.uid()) and (select private.is_staff()));
create policy "staff update own notification marker" on public.staff_notification_reads
  for update to authenticated
  using (user_id = (select auth.uid()) and (select private.is_staff()))
  with check (user_id = (select auth.uid()) and (select private.is_staff()));

revoke all on public.staff_notification_reads from anon, authenticated;
grant select, insert, update on public.staff_notification_reads to authenticated;

-- Realtime: only the feed (rows are filtered through the policy above with the subscriber's own JWT).
alter publication supabase_realtime add table public.staff_notifications;
