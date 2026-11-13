-- A signed-in customer with a confirmed phone who files a "pay on site" request gets it confirmed straight away:
-- the SMS-confirmed phone is the proof, so staff no longer confirm it by hand. Only the customer's own, still
-- pending, unpaid-online website request can be confirmed, and only by the database function below.
create function public.confirm_cash_request(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer := 0;
  v_n integer;
begin
  if v_uid is null then
    return false;
  end if;
  if not exists (select 1 from auth.users u where u.id = v_uid and u.phone_confirmed_at is not null and coalesce(u.phone, '') <> '') then
    return false;
  end if;

  update public.bookings b set status = 'patvirtinta'
   where b.reference = p_reference and b.user_id = v_uid and b.status = 'laukia' and b.payment_id is null and b.source = 'svetaine';
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  update public.quad_rentals q set status = 'patvirtinta'
   where q.reference = p_reference and q.user_id = v_uid and q.status = 'laukia' and q.payment_id is null and q.source = 'svetaine';
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  update public.event_tickets e set status = 'patvirtinta'
   where e.reference = p_reference and e.user_id = v_uid and e.status = 'laukia' and e.payment_id is null and e.source = 'svetaine';
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  return v_count > 0;
end;
$$;

revoke execute on function public.confirm_cash_request(text) from public, anon;
grant execute on function public.confirm_cash_request(text) to authenticated;
