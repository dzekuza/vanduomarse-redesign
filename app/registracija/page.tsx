import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { MemberPlanCheckout } from "@/components/registration/member-plan-checkout";
import { RegistrationFlow, type RegistrationPlan } from "@/components/registration/registration-flow";
import { loadMyRiders } from "@/lib/account-data";
import { getCustomer } from "@/lib/customer";
import type { RegistrationInput } from "@/lib/registration-schema";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Registracija - Vanduo Marse",
  description: "Užsiregistruok internetu — kontaktai, nuotrauka ir taisyklių sutikimas — ir darbuotojas kasoje iškart priskirs tau apyrankę.",
  // A personal form with ?abonementas= variants: not for search results.
  alternates: { canonical: "/registracija" },
  robots: { index: false, follow: true },
};

/** The bracelet plan the visitor came to buy (`?abonementas=`), only if it is on sale online. */
async function loadPlan(id: string | undefined): Promise<RegistrationPlan | undefined> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return undefined;
  const { data } = await createPublicClient().rpc("online_plans");
  const plan = data?.find((p) => p.id === id);
  return plan ? { id: plan.id, name: plan.name, price: plan.price } : undefined;
}

/**
 * What the signed-in customer already gave us: the details of their customer record when there is one (the one matched
 * through their confirmed e-mail or phone), otherwise what the account itself knows; plus whether that record is a finished
 * registration (photo and signed rules). Nothing when signed out.
 */
async function loadAccountContext(): Promise<{ initial: Partial<RegistrationInput>; registeredName: string | null } | undefined> {
  const customer = await getCustomer();
  if (!customer) return undefined;
  const riders = await loadMyRiders();
  // Only a record the account matched through its OWN confirmed e-mail or phone carries `registration`; a match through a
  // secondary number is someone else's record and must never prefill this form.
  const rider = riders.find((r) => r.registration);
  const [firstName = "", ...rest] = customer.name.trim().split(/\s+/);
  return {
    initial: {
      name: rider?.name ?? firstName,
      surname: rider?.surname ?? rest.join(" "),
      email: rider?.registration?.email || customer.email || "",
      phone: rider?.registration?.phone || customer.phone || "",
      phone2: rider?.registration?.phone2 || "",
      birthdate: rider?.registration?.birthdate || "",
    },
    registeredName: rider?.registered ? rider.name : null,
  };
}

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ abonementas?: string; kitas?: string }> }) {
  const { abonementas, kitas } = await searchParams;
  const [plan, account] = await Promise.all([loadPlan(abonementas), loadAccountContext()]);
  const initial = account?.initial;
  // A finished registration buying a plan goes straight to payment, unless they are registering someone else (?kitas=1).
  const member = plan && !kitas ? (account?.registeredName ?? null) : null;

  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* The big title is wider than the 2xl form column from xl, or the two title lines wrap to four. */}
          <div className="xl:w-4xl">
            <BookingHeader
              crumb="Registracija"
              introClassName="max-w-2xl"
              title={plan ? ["Užsakyk", plan.name] : ["Tapk Vanduo", "Marse nariu"]}
              intro={plan && member !== null
                ? "Tavo registracija jau išsaugota, belieka apmokėti."
                : plan
                ? "Prieš apmokėdamas užsiregistruok: kontaktai, nuotrauka ir taisyklės. Apmokėjus planą priskirsime tau, o apyrankę parke priskirs darbuotojas."
                : "Užpildyk kontaktus, nusifotografuok ir pasirašyk taisykles — darbuotojas kasoje iškart priskirs tau apyrankę."}
            />
          </div>
          {plan && member !== null ? <MemberPlanCheckout plan={plan} name={member} /> : <RegistrationFlow plan={plan} initial={kitas ? undefined : initial} />}
        </div>
      </div>
    </BookingPage>
  );
}
