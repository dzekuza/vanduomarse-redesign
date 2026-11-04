import "server-only";
import { REQUEST_PAYMENT_LABEL, type MyRequest } from "@/lib/account";
import { formatHour } from "@/lib/sauna";
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
    supabase.from("bookings").select("id, reference, kind, date, start_hour, hours, nights, stay_units, total, status, payments(status)"),
    supabase.from("quad_rentals").select("id, reference, date, start_hour, hours, units, total, status, payments(status)"),
    supabase.from("event_tickets").select("id, reference, people, total, status, payments(status), events(title, date, start_time)"),
  ]);
  for (const result of [bookings, rentals, tickets]) {
    if (result.error) throw new Error(`Account data: ${result.error.message}`);
  }

  const all: MyRequest[] = [
    ...bookings.data!.map((b): MyRequest => ({
      id: b.id,
      reference: b.reference,
      title: b.kind === "pirtis" ? "Pirtis" : "Nakvynė",
      detail:
        b.kind === "pirtis" && b.start_hour !== null && b.hours !== null
          ? `${formatHour(b.start_hour)}-${formatHour(b.start_hour + b.hours)}`
          : `${b.stay_units ?? 1} × ${b.kind === "kemperis" ? "kemperio vieta" : "namelis"}, ${b.nights ?? 1} n.`,
      date: b.date,
      total: b.total,
      status: b.status,
      payment: paymentOf(b.payments),
    })),
    ...rentals.data!.map((r): MyRequest => ({
      id: r.id,
      reference: r.reference,
      title: "Keturračiai",
      detail: `${formatHour(r.start_hour)}-${formatHour(r.start_hour + r.hours)}, ${r.units} vnt.`,
      date: r.date,
      total: r.total,
      status: r.status,
      payment: paymentOf(r.payments),
    })),
    ...tickets.data!.map((t): MyRequest => ({
      id: t.id,
      reference: t.reference,
      title: t.events?.title ?? "Renginys",
      detail: `${t.people} asm.${t.events ? `, ${t.events.start_time.slice(0, 5)}` : ""}`,
      date: t.events?.date ?? "",
      total: t.total,
      status: t.status,
      payment: paymentOf(t.payments),
    })),
  ];
  return all.toSorted((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference));
}
