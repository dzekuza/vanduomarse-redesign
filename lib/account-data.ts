import "server-only";
import { REQUEST_PAYMENT_LABEL, visibleRiders, type MyInquiry, type MyRequest, type MyRider } from "@/lib/account";
import { formatHour } from "@/lib/sauna";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PAYMENTS = Object.keys(REQUEST_PAYMENT_LABEL);
const paymentOf = (row: { status: string } | null): MyRequest["payment"] =>
  row && PAYMENTS.includes(row.status) ? (row.status as NonNullable<MyRequest["payment"]>) : null;

/**
 * The signed-in customer's own requests, read with their own session: row level security
 * (migration `customer_own_requests`) returns only rows whose `user_id` is their account.
 * Newest date first. Throws if a query fails, so the page shows an error instead of an empty list.
 */
export async function loadMyRequests(): Promise<MyRequest[]> {
  const supabase = await createClient();
  const [bookings, rentals, tickets] = await Promise.all([
    supabase.from("bookings").select("id, reference, kind, date, start_hour, hours, nights, stay_units, total, status, payments(id, status)"),
    supabase.from("quad_rentals").select("id, reference, date, start_hour, hours, units, total, status, payments(id, status)"),
    supabase.from("event_tickets").select("id, reference, people, total, status, payments(id, status), events(title, date, start_time)"),
  ]);
  for (const result of [bookings, rentals, tickets]) {
    if (result.error) throw new Error(`Account data: ${result.error.message}`);
  }

  const all: MyRequest[] = [
    ...bookings.data!.map((b): MyRequest => ({
      id: b.id,
      reference: b.reference,
      title: b.kind === "pirtis" ? "Pirtis" : "Nakvynė",
      kind: b.kind === "pirtis" ? "pirtis" : "nakvyne",
      detail:
        b.kind === "pirtis" && b.start_hour !== null && b.hours !== null
          ? `${formatHour(b.start_hour)}-${formatHour(b.start_hour + b.hours)}`
          : `${b.stay_units ?? 1} × ${b.kind === "kemperis" ? "kemperio vieta" : "namelis"}, ${b.nights ?? 1} n.`,
      date: b.date,
      total: b.total,
      status: b.status,
      payment: paymentOf(b.payments),
      paymentId: b.payments?.id ?? null,
    })),
    ...rentals.data!.map((r): MyRequest => ({
      id: r.id,
      reference: r.reference,
      title: "Keturračiai",
      kind: "keturraciai",
      detail: `${formatHour(r.start_hour)}-${formatHour(r.start_hour + r.hours)}, ${r.units} vnt.`,
      date: r.date,
      total: r.total,
      status: r.status,
      payment: paymentOf(r.payments),
      paymentId: r.payments?.id ?? null,
    })),
    ...tickets.data!.map((t): MyRequest => ({
      id: t.id,
      reference: t.reference,
      title: t.events?.title ?? "Renginys",
      kind: "renginys",
      detail: `${t.people} asm.${t.events ? `, ${t.events.start_time.slice(0, 5)}` : ""}`,
      date: t.events?.date ?? "",
      total: t.total,
      status: t.status,
      payment: paymentOf(t.payments),
      paymentId: t.payments?.id ?? null,
    })),
  ];
  return all.toSorted((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference));
}

/** The stored estimate lines (`{ group, label, amount: { min, max } }`), skipping anything malformed. */
function quoteLines(value: unknown): MyInquiry["lines"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((line) => {
    if (typeof line !== "object" || line === null) return [];
    const { group, label, amount } = line as Record<string, unknown>;
    const money = amount as { min?: unknown; max?: unknown } | null;
    if (typeof group !== "string" || typeof label !== "string" || typeof money?.min !== "number" || typeof money.max !== "number") return [];
    return [{ group, label, amount: { min: money.min, max: money.max } }];
  });
}

/**
 * The customer's calculator quotes ("Pasiūlymai"), through `my_inquiries()`, which matches them by the
 * confirmed e-mail or phone of the signed-in account. A failure (for example before the migration is
 * applied) shows an empty tab instead of breaking the reservations.
 */
export async function loadMyInquiries(): Promise<MyInquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_inquiries");
  if (error || !data) return [];
  return data.map((r): MyInquiry => ({
    id: r.id,
    createdAt: r.created_at,
    eventType: r.event_type,
    date: r.date ?? "",
    guests: r.guests,
    space: r.space,
    estimate: r.estimate_min !== null && r.estimate_max !== null ? { min: r.estimate_min, max: r.estimate_max } : null,
    status: r.status,
    accepted: r.accepted,
    message: r.message ?? "",
    lines: quoteLines(r.lines),
    contact: { name: r.contact_name ?? "", phone: r.contact_phone ?? "", email: r.contact_email ?? "" },
  }));
}

/** The purchases stored with a rider (`{ planName, category, price, soldAt }`), skipping anything malformed. */
function riderPurchases(value: unknown): MyRider["purchases"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((p) => {
    if (typeof p !== "object" || p === null) return [];
    const { planName, category, price, soldAt } = p as Record<string, unknown>;
    if (typeof planName !== "string" || typeof soldAt !== "string") return [];
    return [{ planName, category: typeof category === "string" ? category : "", price: typeof price === "number" ? price : null, soldAt }];
  });
}

/**
 * The customer's wakeboard plan ("Vandenlentės"), through `my_riders()`, which matches rider records by the
 * confirmed e-mail or phone of the signed-in account. A failure (for example before the migration is applied)
 * shows an empty tab instead of breaking the reservations.
 */
export async function loadMyRiders(): Promise<MyRider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_riders");
  if (error || !data) return [];
  const riders = await Promise.all(data.map(async (r): Promise<MyRider> => ({
    id: r.id,
    name: r.name,
    surname: r.surname,
    plan: r.plan_name ? { name: r.plan_name, description: r.plan_description ?? "", category: r.plan_category ?? "", price: r.plan_price } : null,
    cards: r.cards ?? [],
    purchases: riderPurchases(r.purchases),
    // Until the migrations that add `registered` and the registration fields are applied they are missing: assume
    // registered and hide the details, so no wrong prompt shows.
    registered: r.registered ?? true,
    registration: r.signed_at === undefined
      ? null
      : {
          email: r.email ?? "",
          phone: r.phone ?? "",
          phone2: r.phone2 ?? "",
          birthdate: r.birthdate ?? "",
          photoUrl: r.avatar_path ? await signedPhotoUrl(r.avatar_path) : null,
          signedAt: r.signed_at,
          termsVersion: r.terms_version ?? "",
        },
  })));
  return visibleRiders(riders);
}

/** The profile photo bucket is private: a one-hour signed URL for a path that belongs to a rider matched to this account. */
async function signedPhotoUrl(path: string): Promise<string | null> {
  try {
    const { data } = await createAdminClient().storage.from("rider-photos").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } catch (e) {
    console.error("Account data: could not sign the rider photo", e);
    return null;
  }
}
