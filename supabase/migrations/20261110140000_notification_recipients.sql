-- Vanduo Marse: who gets staff SMS notifications, and for what.
--
-- Until now one number (STAFF_NOTIFY_PHONE) got every staff text. Owners now keep a list in
-- /admin/pranesimai: each person has a phone number and the topics they want. Owner-only, like
-- staff management (ADR-0012: this is not a page permission).
--
-- Topics: 'visi' (everything, including topics added later), 'rezervacijos' (new sauna, stay and
-- quad bookings), 'uzklausos' (event enquiries, tickets, calculator, tour sign-ups), 'mokejimai'
-- (paid, payments to check, double payments).

create table public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  -- E.164 with a plus sign, normalised by the server action ("+37061234567").
  phone text not null check (phone ~ '^\+[0-9]{8,15}$'),
  topics text[] not null default '{visi}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_recipients_topics_known check (
    cardinality(topics) >= 1 and topics <@ array['visi', 'rezervacijos', 'uzklausos', 'mokejimai']
  )
);

create unique index notification_recipients_phone_idx on public.notification_recipients (phone);

create trigger notification_recipients_updated_at before update on public.notification_recipients
  for each row execute function public.set_updated_at();

comment on table public.notification_recipients is
  'Phone numbers that receive staff SMS, per topic. Owner-only. The server reads them through staff_notify_phones().';

alter table public.notification_recipients enable row level security;

create policy "owner reads notification recipients" on public.notification_recipients
  for select to authenticated using ((select private.is_owner()));
create policy "owner inserts notification recipients" on public.notification_recipients
  for insert to authenticated with check ((select private.is_owner()));
create policy "owner updates notification recipients" on public.notification_recipients
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner deletes notification recipients" on public.notification_recipients
  for delete to authenticated using ((select private.is_owner()));

-- The numbers to text for one topic. Null means nobody has been set up (no active rows), so the
-- server falls back to the STAFF_NOTIFY_PHONE env var; an empty array means people are set up but
-- none of them wants this topic. Service role only, like the other server-side lookups.
create function public.staff_notify_phones(p_topic text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (select 1 from public.notification_recipients r where r.active) then null
    else coalesce(
      (select array_agg(r.phone order by r.created_at)
         from public.notification_recipients r
        where r.active and (r.topics @> array['visi'] or r.topics @> array[p_topic])),
      '{}'
    )
  end;
$$;

comment on function public.staff_notify_phones(text) is
  'Active phone numbers subscribed to a topic (or to visi); null when no recipient is configured. Used by the server for staff SMS.';

revoke execute on function public.staff_notify_phones(text) from public, anon, authenticated;
grant execute on function public.staff_notify_phones(text) to service_role;
