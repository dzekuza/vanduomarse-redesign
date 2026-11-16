-- The bracelet plan catalogue no longer has the Pramogos, Apgyvendinimas, Parduotuvė and Dubenėlyje tabs.
-- No plan used them (checked before applying); the check now allows only the three that remain.
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.ride_plans'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%Apgyvendinimas%';
  if c is not null then execute format('alter table public.ride_plans drop constraint %I', c); end if;
end $$;

alter table public.ride_plans
  add constraint ride_plans_category_check check (category in ('Plaukimas', 'Įranga', 'Abonementai'));
