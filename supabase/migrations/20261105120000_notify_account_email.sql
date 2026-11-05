-- Notification emails go only to an address the account itself confirmed (ADR-0028).
--
-- A request row's customer_email is what the form sent. `require_verified_phone` lets a signed-in
-- request through on a recently verified phone even when its email is not the account's, and
-- `user_id` still defaults to auth.uid(), so `user_id is not null` does not prove the email.
-- These two functions read the confirmed email straight from auth.users instead. Service role only.

create function public.account_notify_email(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
    from auth.users u
   where u.id = p_user
     and u.email_confirmed_at is not null
     and coalesce(u.email, '') <> '';
$$;

comment on function public.account_notify_email(uuid) is
  'The confirmed email of an account, or null. Used by the server to address booking notification emails.';

create function public.payment_notify_email(p_payment_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select public.account_notify_email(p.user_id)
    from public.payments p
   where p.id = p_payment_id
     and p.user_id is not null;
$$;

comment on function public.payment_notify_email(uuid) is
  'The confirmed email of the account that owns a payment, or null. Used by the Stripe webhook.';

revoke execute on function public.account_notify_email(uuid) from public, anon, authenticated;
revoke execute on function public.payment_notify_email(uuid) from public, anon, authenticated;
grant execute on function public.account_notify_email(uuid) to service_role;
grant execute on function public.payment_notify_email(uuid) to service_role;
