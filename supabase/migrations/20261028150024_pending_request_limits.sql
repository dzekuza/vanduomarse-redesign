-- Vanduo Marse: stop anonymous requests from hoarding inventory.
-- Public requests land as 'laukia' and hold their slot until staff answer, so
-- (1) unanswered web requests expire after 48 hours and (2) one contact may
-- hold only a few pending requests at a time.

-- ---------------------------------------------------------------------------
-- 1. Expiry
-- ---------------------------------------------------------------------------

create function public.expire_pending_requests()
returns table (bookings integer, tickets integer, rentals integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  b integer; t integer; r integer;
begin
  update public.bookings set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours';
  get diagnostics b = row_count;

  update public.event_tickets set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours';
  get diagnostics t = row_count;

  update public.quad_rentals set status = 'atsaukta'
   where status = 'laukia' and source = 'svetaine' and created_at < now() - interval '48 hours';
  get diagnostics r = row_count;

  return query select b, t, r;
end;
$$;

revoke execute on function public.expire_pending_requests() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('expire-pending-requests', '*/30 * * * *', $$select public.expire_pending_requests()$$);

-- ---------------------------------------------------------------------------
-- 2. Per-contact cap on pending web requests
-- ---------------------------------------------------------------------------

-- Pending web requests (bookings, tickets, quad rentals) under the same email or phone number.
create function private.pending_web_requests(p_email text, p_phone text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with contact as (
    select lower(coalesce(p_email, '')) as email, regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as phone
  ), pending as (
    select customer_email, customer_phone from public.bookings where status = 'laukia' and source = 'svetaine'
    union all
    select customer_email, customer_phone from public.event_tickets where status = 'laukia' and source = 'svetaine'
    union all
    select customer_email, customer_phone from public.quad_rentals where status = 'laukia' and source = 'svetaine'
  )
  select count(*)::integer
  from pending p, contact c
  where (c.email <> '' and lower(coalesce(p.customer_email, '')) = c.email)
     or (c.phone <> '' and regexp_replace(coalesce(p.customer_phone, ''), '\D', '', 'g') = c.phone);
$$;

revoke execute on function private.pending_web_requests(text, text) from public, anon, authenticated;

create function public.limit_pending_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'laukia' and new.source = 'svetaine'
     and private.pending_web_requests(new.customer_email, new.customer_phone) >= 3 then
    raise exception 'Too many pending requests for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_pending_requests() from public, anon, authenticated;

create trigger bookings_limit_pending before insert on public.bookings
  for each row execute function public.limit_pending_requests();
create trigger event_tickets_limit_pending before insert on public.event_tickets
  for each row execute function public.limit_pending_requests();
create trigger quad_rentals_limit_pending before insert on public.quad_rentals
  for each row execute function public.limit_pending_requests();

-- Inquiries hold no inventory, so the cap is looser: 5 new ones per contact per day.
create function public.limit_new_inquiries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'nauja' and (
    select count(*) from public.inquiries q
     where q.status = 'nauja' and q.created_at > now() - interval '24 hours'
       and ((new.customer_email is not null and lower(q.customer_email) = lower(new.customer_email))
         or (new.customer_phone is not null
             and regexp_replace(coalesce(q.customer_phone, ''), '\D', '', 'g') = regexp_replace(new.customer_phone, '\D', '', 'g')))
  ) >= 5 then
    raise exception 'Too many inquiries for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_new_inquiries() from public, anon, authenticated;

create trigger inquiries_limit_new before insert on public.inquiries
  for each row execute function public.limit_new_inquiries();
