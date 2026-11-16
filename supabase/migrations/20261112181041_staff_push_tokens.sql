-- Vanduo Marse: mobile app push notification tokens for staff (iOS / Expo Push Service).
--
-- Each signed-in staff member can register their iOS device token in the mobile admin app
-- and choose which topics ('visi', 'rezervacijos', 'uzklausos', 'mokejimai') they want push
-- alerts for. Staff manage their own device rows; owners can also read all rows; the Next.js
-- server dispatches push notifications alongside SMS via `staff_push_tokens_for(p_topic)`.

create table public.staff_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff(user_id) on delete cascade,
  expo_push_token text not null check (
    expo_push_token ~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$'
  ),
  device_name text not null default 'iPhone' check (char_length(btrim(device_name)) between 1 and 80),
  topics text[] not null default '{visi}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_push_tokens_topics_known check (
    cardinality(topics) >= 1 and topics <@ array['visi', 'rezervacijos', 'uzklausos', 'mokejimai']
  )
);

create unique index staff_push_tokens_token_idx on public.staff_push_tokens (expo_push_token);
create index staff_push_tokens_user_id_idx on public.staff_push_tokens (user_id);

create trigger staff_push_tokens_updated_at before update on public.staff_push_tokens
  for each row execute function public.set_updated_at();

comment on table public.staff_push_tokens is
  'Expo push tokens registered by staff on the iOS mobile admin app, filtered by topic.';

alter table public.staff_push_tokens enable row level security;

create policy "staff reads own push tokens or owner reads all" on public.staff_push_tokens
  for select to authenticated
  using (
    ((select private.is_staff()) and user_id = (select auth.uid()))
    or (select private.is_owner())
  );

create policy "staff inserts own push tokens" on public.staff_push_tokens
  for insert to authenticated
  with check ((select private.is_staff()) and user_id = (select auth.uid()));

create policy "staff updates own push tokens" on public.staff_push_tokens
  for update to authenticated
  using ((select private.is_staff()) and user_id = (select auth.uid()))
  with check ((select private.is_staff()) and user_id = (select auth.uid()));

create policy "staff deletes own push tokens or owner deletes" on public.staff_push_tokens
  for delete to authenticated
  using (
    ((select private.is_staff()) and user_id = (select auth.uid()))
    or (select private.is_owner())
  );

revoke all on table public.staff_push_tokens from anon;
grant select, insert, update, delete on table public.staff_push_tokens to authenticated;

-- Active Expo push tokens for active staff subscribed to `p_topic` (or 'visi').
-- Service role only, called by lib/push/staff-push.ts alongside SMS notifications.
create function public.staff_push_tokens_for(p_topic text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select array_agg(t.expo_push_token order by t.created_at)
       from public.staff_push_tokens t
       join public.staff s on s.user_id = t.user_id
      where t.active
        and s.active
        and (t.topics @> array['visi'] or t.topics @> array[p_topic])),
    '{}'
  );
$$;

comment on function public.staff_push_tokens_for(text) is
  'Active Expo push tokens of active staff subscribed to a topic (or visi). Service role only.';

revoke execute on function public.staff_push_tokens_for(text) from public, anon, authenticated;
grant execute on function public.staff_push_tokens_for(text) to service_role;
