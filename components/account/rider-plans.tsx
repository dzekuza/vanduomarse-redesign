import { RegistrationDetails } from "@/components/account/registration-details";
import { Cta } from "@/components/cta";
import type { MyRider } from "@/lib/account";
import { formatPlanPrice } from "@/lib/ride-plans";

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("lt-LT");

const BROWSE_PLANS_HREF = "/rezervacija?veikla=wake";

/** Browse plans and passes, plus a way to finish /registracija when this account has not. */
function RiderActions({ needsRegistration }: { needsRegistration: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Cta tone="dark" small href={BROWSE_PLANS_HREF} className="sm:min-w-64">
        Naršyti planus ir abonementus
      </Cta>
      {needsRegistration ? (
        <Cta tone="cream" small href="/registracija" className="sm:min-w-64">
          Užbaigti registraciją
        </Cta>
      ) : null}
    </div>
  );
}

/** The customer's wakeboard plan (apyrankė): current plan, bracelet number and what they bought before. */
export function RiderPlans({ riders }: { riders: MyRider[] }) {
  if (riders.length === 0) {
    return (
      <div className="space-y-3 border border-line p-5 sm:p-6">
        <p className="text-copy">
          Vandenlenčių plano ar apyrankės šiai paskyrai dar nėra. Jei jau važinėji pas mus, įsitikink, kad paskyroje naudojamas tas pats el. paštas ar telefonas, kuriuos nurodei parke.
        </p>
        <RiderActions needsRegistration />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <RiderActions needsRegistration={!riders.some((rider) => rider.registered)} />
      {riders.map((rider) => (
        <article key={rider.id} aria-label={`${rider.name} ${rider.surname}`} className="space-y-5 border border-line p-5 sm:p-6">
          <header className="space-y-1">
            <p className="text-micro uppercase text-copy">{rider.name} {rider.surname}</p>
            {rider.plan ? (
              <>
                <h3 className="font-display text-heading font-bold uppercase">{rider.plan.name}</h3>
                {rider.plan.description ? <p className="text-sm text-copy">{rider.plan.description}</p> : null}
                <p className="text-sm">
                  <span className="border border-line px-2 py-0.5">{rider.plan.category}</span>
                  {rider.plan.price !== null ? <span className="ml-2 border border-line px-2 py-0.5">{formatPlanPrice(rider.plan.price)}</span> : null}
                </p>
              </>
            ) : (
              <p className="text-copy">Aktyvaus plano dar nėra. Planą parduos parko komanda prie įėjimo.</p>
            )}
          </header>

          <dl className="text-sm">
            <dt className="text-micro uppercase text-copy">Apyrankė</dt>
            <dd className="mt-1 font-bold">{rider.cards.length ? rider.cards.join(", ") : "Dar nepriskirta"}</dd>
          </dl>

          {rider.registration ? <RegistrationDetails registration={rider.registration} registered={rider.registered} /> : null}

          {rider.purchases.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-item font-bold">Pirkiniai</h4>
              <ul className="divide-y divide-line border border-line">
                {rider.purchases.map((p) => (
                  <li key={`${p.soldAt}-${p.planName}`} className="flex items-baseline justify-between gap-4 p-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-bold">{p.planName}</span>
                      <span className="block text-xs text-copy">{[p.category, dayLabel(p.soldAt)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{formatPlanPrice(p.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      ))}
    </div>
  );
}
