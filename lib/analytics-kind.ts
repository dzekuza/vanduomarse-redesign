import type { ActivityKind } from "@/lib/analytics";
import type { PaymentRequestView } from "@/components/reservation/payment-requests";
import type { Plans } from "@/lib/reservation";

/** The kind and item name a reservation reports to GA and Meta, so sauna, session, stay and quad sales can be told apart in ad reports. */
export interface Tracking {
  kind: ActivityKind;
  itemName?: string;
}

/**
 * What the visitor is booking on /rezervacija or a service page: the single activity chosen (private sauna, a sauna session,
 * a stay, a quad rental), or "reservation" when the plan mixes several.
 */
export function trackingForPlans(plans: Plans): Tracking {
  const chosen = [plans.pirtis, plans.keturraciai, plans.nakvyne].filter((plan) => Boolean(plan));
  if (chosen.length !== 1) return { kind: "reservation" };
  const { pirtis, nakvyne } = plans;
  if (pirtis) {
    if (pirtis.mode === "session") return { kind: "sauna_session", itemName: pirtis.session?.title ?? pirtis.program?.name };
    if (pirtis.mode === "private") return { kind: "sauna", itemName: pirtis.program.name };
    return { kind: "sauna", itemName: pirtis.sauna.name };
  }
  if (nakvyne) return { kind: "stay", itemName: nakvyne.type?.label };
  return { kind: "quad_rental" };
}

/** The same for a paid payment's requests: one kind of request keeps its kind, a mix is "reservation". */
export function trackingForRequests(requests: readonly PaymentRequestView[]): Tracking {
  const kinds = new Set<ActivityKind>(
    requests.map(({ kind }) => (kind === "pirtis" ? "sauna" : kind === "keturraciai" ? "quad_rental" : kind === "renginys" ? "event_registration" : "stay")),
  );
  if (kinds.size !== 1) return { kind: "reservation" };
  const [kind] = kinds;
  return { kind, ...(requests.length === 1 ? { itemName: requests[0].title } : {}) };
}
