import { notFound } from "next/navigation";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { PlanRegistration, type RegistrationPlan } from "@/components/registration/plan-registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { loadMyRiders } from "@/lib/account-data";
import { getCustomer } from "@/lib/customer";
import type { RegistrationInput } from "@/lib/registration-schema";
import { getOnlinePlans } from "@/lib/data/public";

import { isWakeBlackFridayDiscount, WAKE_BLACK_FRIDAY_DISCOUNT, WAKE_SEASON_PASS_ID } from "@/lib/wake-black-friday";

/** The bracelet plan the visitor came to buy (`?abonementas=`), only if it is on sale online. */
async function loadPlan(id: string | undefined): Promise<RegistrationPlan | undefined> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return undefined;
  const { data } = await getOnlinePlans();
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

export interface RegistrationParams {
  abonementas?: string;
  kitas?: string;
  nuolaida?: string | string[];
}

export async function RegistrationPageContent({ params, blackFriday = false }: {
  params: RegistrationParams;
  blackFriday?: boolean;
}) {
  const { abonementas, kitas, nuolaida } = params;
  const [plan, account] = await Promise.all([loadPlan(blackFriday ? WAKE_SEASON_PASS_ID : abonementas), loadAccountContext()]);
  if (blackFriday && !plan) notFound();
  const code = blackFriday ? WAKE_BLACK_FRIDAY_DISCOUNT.code : typeof nuolaida === "string" ? nuolaida : undefined;
  const promo = plan && code ? await checkDiscountCode(code) : null;
  const checked = promo && "data" in promo && promo.data.services.includes("planai") ? promo.data : null;
  if (blackFriday && process.env.NODE_ENV === "production" && !isWakeBlackFridayDiscount(checked)) notFound();
  // Local design previews also work before the checkout database is migrated.
  const discount = blackFriday ? WAKE_BLACK_FRIDAY_DISCOUNT : checked;
  const checkoutKey = `${plan?.id ?? "registration"}:${discount?.code ?? ""}`;
  const initial = account?.initial;
  // A finished registration buying a plan goes straight to payment, unless they are registering someone else (?kitas=1).
  const member = plan && !kitas ? (account?.registeredName ?? null) : null;
  const planTitle = plan?.name.toLowerCase() === "wake sezono abonementas" ? "WAKE sezono abonementą" : plan?.name;
  const titleLine = blackFriday ? <>WAKE sezono <span className="text-rust">abonementą</span></> : planTitle;

  const header = (
    <BookingHeader
      crumb="Registracija"
      introClassName="max-w-2xl"
      title={titleLine ? ["Užsakyk", titleLine] : ["Tapk Vanduo", "Marse nariu"]}
      intro={plan && member !== null
        ? "Tavo registracija jau išsaugota, belieka apmokėti."
        : plan
        ? "Apmokėk dabar su vardu ir el. paštu. Užsiregistruoti (kontaktai, nuotrauka, taisyklės) galėsi vėliau, prieš gaudamas apyrankę."
        : "Užpildyk kontaktus, nusifotografuok ir pasirašyk taisykles — darbuotojas kasoje iškart priskirs tau apyrankę."}
    />
  );

  return (
    <BookingPage>
      <div className="theme-reservation flex-1 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        {plan ? (
          <PlanRegistration
            key={checkoutKey}
            plan={plan}
            header={header}
            member={member}
            initial={kitas ? undefined : initial}
            initialDiscount={discount}
            blackFriday={blackFriday}
            invalidDiscount={!!promo && !discount}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="xl:w-4xl">{header}</div>
            <RegistrationFlow initial={kitas ? undefined : initial} />
          </div>
        )}
      </div>
    </BookingPage>
  );
}
