-- Customer accounts for the /rezervacija page (ADR-0027).
--
-- A visitor signs in at checkout with a one-time code sent to their phone or email (Supabase
-- Auth creates the account on first use). Requests filed while signed in carry the account's
-- user id, and the account's confirmed phone or email replaces the separate SMS phone check:
-- a signed-in customer may file requests only under a phone or email their account has
-- confirmed. The older anon + verified-phone path stays for the stand-alone and embed forms.

-- ---------------------------------------------------------------------------
-- 1. Who filed the request
-- ---------------------------------------------------------------------------

-- auth.uid() is read from the caller's JWT even inside the security definer booking functions;
-- it is null for anon, the service role and SQL without a JWT (staff entries, seed, cron).
alter table public.bookings add column user_id uuid default auth.uid() references auth.users (id) on delete set null;
alter table public.quad_rentals add column user_id uuid default auth.uid() references auth.users (id) on delete set null;
alter table public.event_tickets add column user_id uuid default auth.uid() references auth.users (id) on delete set null;

create index bookings_user_idx on public.bookings (user_id) where user_id is not null;
create index quad_rentals_user_idx on public.quad_rentals (user_id) where user_id is not null;
create index event_tickets_user_idx on public.event_tickets (user_id) where user_id is not null;

comment on column public.bookings.user_id is 'The signed-in customer account that filed the request, if any.';

-- ---------------------------------------------------------------------------
-- 2. A confirmed account contact counts as a verified phone
-- ---------------------------------------------------------------------------

-- True when the caller is signed in, the row carries at least one contact, and EVERY contact on it
-- (phone and/or email) is one their account confirmed with a one-time code. A phone or email that
-- belongs to someone else makes it false, so a confirmed email can never vouch for a stranger's
-- phone. Supabase stores the phone as digits without "+".
create function private.account_owns_contact(p_phone text, p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and (coalesce(private.norm_phone(p_phone), '') <> '' or btrim(coalesce(p_email, '')) <> '')
     and exists (
       select 1
         from auth.users u
        where u.id = auth.uid()
          and (
            coalesce(private.norm_phone(p_phone), '') = ''
            or (u.phone_confirmed_at is not null and coalesce(u.phone, '') <> ''
                and private.norm_phone(p_phone) = private.norm_phone(u.phone))
          )
          and (
            btrim(coalesce(p_email, '')) = ''
            or (u.email_confirmed_at is not null and coalesce(u.email, '') <> ''
                and lower(btrim(p_email)) = lower(u.email))
          )
     );
$$;

revoke execute on function private.account_owns_contact(text, text) from public, anon, authenticated;

-- Same rule as before (anon or a signed-in non-staff user needs a recently verified phone), plus:
-- requests on bookings, quad rentals and event tickets pass when every contact they carry is the
-- caller's own confirmed phone or email.
create or replace function private.require_verified_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or private.is_staff() then
    return new;
  end if;

  case tg_table_name
    when 'coupons' then
      v_phone := new.buyer_phone;
    when 'inquiries' then
      if new.source <> 'renginys' then
        return new;
      end if;
      v_phone := new.customer_phone;
    else
      if new.source <> 'svetaine' then
        return new;
      end if;
      if private.account_owns_contact(new.customer_phone, new.customer_email) then
        return new;
      end if;
      v_phone := new.customer_phone;
  end case;

  if not private.phone_recently_verified(v_phone) then
    raise exception 'Phone number not verified' using errcode = '42501', hint = 'phone_unverified';
  end if;
  return new;
end;
$$;
