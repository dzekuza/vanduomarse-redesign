-- Vanduo Marse: security + performance hardening from the 2026-11-11 audit.
--
-- 1. register_rider_public: contact + global throttle, sane birthdate and terms_version.
-- 2. finalize_rider_registration_public: paths must be this rider's own file and
--    the object must exist in Storage.
-- 3. rls_auto_enable(): event-trigger helper, no reason for API roles to execute it.
-- 4. anon: drop every table privilege, then grant back SELECT only on the tables that
--    have an anon read policy (RLS already blocked the rest; this is defence in depth).
-- 5. Index the seven foreign keys the performance advisor flagged.

-- ---------------------------------------------------------------------------
-- 1. register_rider_public
-- ---------------------------------------------------------------------------

create or replace function public.register_rider_public(
  p_name text, p_surname text, p_email text, p_phone text, p_phone2 text,
  p_birthdate date, p_terms_version text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rider_id uuid;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := private.norm_phone(p_phone);
begin
  if char_length(coalesce(p_terms_version, '')) not between 1 and 40 then
    raise exception 'Terms version is not valid' using errcode = '23514', hint = 'terms_invalid';
  end if;
  if p_birthdate is not null and (p_birthdate < date '1900-01-01' or p_birthdate > current_date) then
    raise exception 'Birth date is not valid' using errcode = '23514', hint = 'birthdate_invalid';
  end if;
  if v_email = '' and length(v_phone) < 8 then
    raise exception 'Contact details are not valid' using errcode = '23514', hint = 'contact_invalid';
  end if;

  -- Serialise requests from the same contact so the cap below cannot be raced.
  if v_email <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:e:' || v_email));
  end if;
  if v_phone <> '' then
    perform pg_advisory_xact_lock(hashtext('contact:p:' || v_phone));
  end if;

  -- Unfinished self-registrations (no photo yet) per contact in 24 h.
  if (
    select count(*) from public.riders r
     where r.self_registered and r.avatar_path is null
       and r.created_at > now() - interval '24 hours'
       and ((v_email <> '' and lower(btrim(coalesce(r.email, ''))) = v_email)
         or (v_phone <> '' and private.norm_phone(r.phone) = v_phone))
  ) >= 3 then
    raise exception 'Too many registrations for this contact' using errcode = '54000', hint = 'too_many_pending';
  end if;

  -- Park-wide ceiling: far above a busy event day, far below a flood.
  if (
    select count(*) from public.riders r
     where r.self_registered and r.created_at > now() - interval '1 hour'
  ) >= 100 then
    raise exception 'Too many registrations right now' using errcode = '54000', hint = 'too_many_registrations';
  end if;

  insert into public.riders (name, surname, email, phone, phone2, birthdate, self_registered)
  values (p_name, p_surname, nullif(p_email, ''), nullif(p_phone, ''), nullif(p_phone2, ''), p_birthdate, true)
  returning id into v_rider_id;

  insert into public.rider_waivers (rider_id, terms_version) values (v_rider_id, p_terms_version);

  return v_rider_id;
end;
$$;

revoke all on function public.register_rider_public(text, text, text, text, text, date, text) from public;
grant execute on function public.register_rider_public(text, text, text, text, text, date, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. finalize_rider_registration_public
-- ---------------------------------------------------------------------------

create or replace function public.finalize_rider_registration_public(
  p_rider_id uuid, p_avatar_path text, p_signature_path text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_avatar_path ~ ('^' || p_rider_id::text || '/avatar\.(jpg|png|webp)$')
     and exists (select 1 from storage.objects o where o.bucket_id = 'rider-photos' and o.name = p_avatar_path) then
    update public.riders set avatar_path = p_avatar_path
     where id = p_rider_id and self_registered and avatar_path is null;
  end if;

  if p_signature_path = p_rider_id::text || '/signature.png'
     and exists (select 1 from storage.objects o where o.bucket_id = 'rider-waivers' and o.name = p_signature_path) then
    update public.rider_waivers set signature_path = p_signature_path
     where rider_id = p_rider_id and signature_path is null;
  end if;
end;
$$;

revoke all on function public.finalize_rider_registration_public(uuid, text, text) from public;
grant execute on function public.finalize_rider_registration_public(uuid, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. rls_auto_enable
-- ---------------------------------------------------------------------------

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. anon table privileges
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

grant select on
  public.coupon_products,
  public.events,
  public.price_items,
  public.quad_settings,
  public.quad_tour_accessories,
  public.quad_tour_routes,
  public.quad_types,
  public.sauna_programs,
  public.sauna_settings,
  public.sauna_upsell_links,
  public.sauna_upsells,
  public.saunas,
  public.stay_types
to anon;

-- ---------------------------------------------------------------------------
-- 5. Foreign-key indexes
-- ---------------------------------------------------------------------------

create index if not exists bookings_program_idx on public.bookings (program_id);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists purchases_plan_idx on public.purchases (plan_id);
create index if not exists purchases_sold_by_idx on public.purchases (sold_by);
create index if not exists rider_comments_author_idx on public.rider_comments (author_id);
create index if not exists rider_documents_uploaded_by_idx on public.rider_documents (uploaded_by);
create index if not exists sauna_programs_sauna_idx on public.sauna_programs (sauna_id);
