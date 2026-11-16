-- Vanduo Marse: staff notification recipients can have an e-mail address, and there are service topics.
--
-- Until now /admin/pranesimai only listed phone numbers (SMS). A recipient now has a phone, an e-mail, or
-- both: the same topics decide which texts and which e-mails they get. Topics gain the services, so a
-- person can be told about everything that concerns the sauna ('pirtis'), the quads ('keturraciai') or
-- the cabins ('nakvyne'): new bookings and their payments.
--
-- Topics: 'visi' (everything), 'rezervacijos' (new bookings of any service), 'uzklausos' (event enquiries,
-- tickets, calculator, tour sign-ups), 'mokejimai' (every payment), 'pirtis' / 'keturraciai' / 'nakvyne'
-- (bookings and payments of that service).
--
-- E-mail routing mirrors SMS: while no active recipient has an e-mail, the server keeps using the service
-- inboxes (STAFF_INBOX in lib/contacts.ts) and STAFF_NOTIFY_EMAIL; once one does, only the list is used.

alter table public.notification_recipients
  alter column phone drop not null,
  add column email text;

alter table public.notification_recipients
  add constraint notification_recipients_email_shape check (
    email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
  ),
  add constraint notification_recipients_has_channel check (phone is not null or email is not null);

-- One row per address, whatever the capitalisation. (The phone index from the first migration already
-- allows several null phones.)
create unique index notification_recipients_email_idx on public.notification_recipients (lower(email)) where email is not null;

alter table public.notification_recipients drop constraint notification_recipients_topics_known;
alter table public.notification_recipients add constraint notification_recipients_topics_known check (
  cardinality(topics) >= 1
  and topics <@ array['visi', 'rezervacijos', 'uzklausos', 'mokejimai', 'pirtis', 'keturraciai', 'nakvyne']
);

comment on table public.notification_recipients is
  'Phone numbers and e-mail addresses that receive staff SMS / e-mail, per topic. Owner-only. The server reads them through staff_notify_phones_for() and staff_notify_emails_for().';

-- The numbers to text for any of these topics. Null means nobody with a phone has been set up (no active
-- row with a phone), so the server falls back to the STAFF_NOTIFY_PHONE env var; an empty array means
-- people are set up but none of them wants this. Service role only.
create function public.staff_notify_phones_for(p_topics text[])
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (select 1 from public.notification_recipients r where r.active and r.phone is not null) then null
    else coalesce(
      (select array_agg(r.phone order by r.created_at)
         from public.notification_recipients r
        where r.active and r.phone is not null and r.topics && (array['visi'] || p_topics)),
      '{}'
    )
  end;
$$;

-- The same for e-mail addresses: null while no active row has one (the server then uses the service inboxes).
create function public.staff_notify_emails_for(p_topics text[])
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (select 1 from public.notification_recipients r where r.active and r.email is not null) then null
    else coalesce(
      (select array_agg(r.email order by r.created_at)
         from public.notification_recipients r
        where r.active and r.email is not null and r.topics && (array['visi'] || p_topics)),
      '{}'
    )
  end;
$$;

comment on function public.staff_notify_phones_for(text[]) is
  'Active phone numbers subscribed to any of the topics (or visi); null when no recipient with a phone is set up. Used by the server for staff SMS.';
comment on function public.staff_notify_emails_for(text[]) is
  'Active e-mail addresses subscribed to any of the topics (or visi); null when no recipient with an e-mail is set up. Used by the server for staff e-mail.';

revoke execute on function public.staff_notify_phones_for(text[]) from public, anon, authenticated;
revoke execute on function public.staff_notify_emails_for(text[]) from public, anon, authenticated;
grant execute on function public.staff_notify_phones_for(text[]) to service_role;
grant execute on function public.staff_notify_emails_for(text[]) to service_role;

-- The single-topic function the running server still calls until the new code is deployed: keep it
-- working now that a recipient can have no phone.
create or replace function public.staff_notify_phones(p_topic text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select public.staff_notify_phones_for(array[p_topic]);
$$;
