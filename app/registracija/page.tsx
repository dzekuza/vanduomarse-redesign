import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { RegistrationFlow, type RegistrationPlan } from "@/components/registration/registration-flow";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Registracija - Vanduo Marse",
  description: "Užsiregistruok internetu — kontaktai, nuotrauka ir taisyklių sutikimas — ir darbuotojas kasoje iškart priskirs tau apyrankę.",
};

/** The bracelet plan the visitor came to buy (`?abonementas=`), only if it is on sale online. */
async function loadPlan(id: string | undefined): Promise<RegistrationPlan | undefined> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return undefined;
  const { data } = await createPublicClient().rpc("online_plans");
  const plan = data?.find((p) => p.id === id);
  return plan ? { id: plan.id, name: plan.name, price: plan.price } : undefined;
}

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ abonementas?: string }> }) {
  const { abonementas } = await searchParams;
  const plan = await loadPlan(abonementas);

  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* The big title is wider than the 2xl form column from xl, or the two title lines wrap to four. */}
          <div className="xl:w-4xl">
            <BookingHeader
              crumb="Registracija"
              title={plan ? ["Užsakyk", plan.name] : ["Tapk Vanduo", "Marse nariu"]}
              intro={plan
                ? "Prieš apmokėdamas užsiregistruok: kontaktai, nuotrauka ir taisyklės. Apmokėjus planą priskirsime tau, o apyrankę parke priskirs darbuotojas."
                : "Užpildyk kontaktus, nusifotografuok ir pasirašyk taisykles — darbuotojas kasoje iškart priskirs tau apyrankę."}
            />
          </div>
          <RegistrationFlow plan={plan} />
        </div>
      </div>
    </BookingPage>
  );
}
