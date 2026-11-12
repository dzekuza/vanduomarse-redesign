import { formatEuro } from "@/lib/coupons";
import { formatHour, longDateLabel } from "@/lib/sauna";

/** One request a payment covers, as the page shows it (see the `payment_requests` database function). */
export interface PaymentRequestView {
  reference: string;
  kind: "pirtis" | "namelis" | "kemperis" | "keturraciai" | "renginys";
  title: string;
  /** yyyy-mm-dd */
  date: string;
  startHour: number | null;
  hours: number | null;
  nights: number | null;
  units: number | null;
  guests: number | null;
  /** HH:MM, tickets only. */
  startTime: string | null;
  total: number;
}

const dayLabel = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return longDateLabel(new Date(y, m - 1, d));
};

/** The day `nights` after a yyyy-mm-dd key, as a label. */
const dayAfter = (key: string, nights: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return longDateLabel(new Date(y, m - 1, d + nights));
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The lines under a request's title: date, time or stay length, and how many. */
function detailLines(r: PaymentRequestView): string[] {
  const lines: string[] = [];
  const stay = r.kind === "namelis" || r.kind === "kemperis";
  if (r.date && stay) lines.push(`Atvykimas ${dayLabel(r.date)}`, `Išvykimas ${dayAfter(r.date, r.nights ?? 1)}`);
  else if (r.date) lines.push(dayLabel(r.date));
  if (r.startHour !== null && r.hours !== null) lines.push(`${formatHour(r.startHour)}–${formatHour(r.startHour + r.hours)} (${plural(r.hours, "val.", "val.")})`);
  if (r.startTime) lines.push(r.startTime);
  if (stay) {
    const units = r.units ?? 1;
    const what = r.kind === "kemperis" ? plural(units, "kemperio vieta", "kemperio vietos") : plural(units, "namelis", "nameliai");
    const nights = r.nights ?? 1;
    lines.push(`${what}, ${plural(nights, "naktis", "naktys")}`);
  }
  if (r.kind === "keturraciai" && r.units) lines.push(plural(r.units, "keturratis", "keturračiai"));
  if (r.guests) lines.push(r.kind === "renginys" ? plural(r.guests, "asmuo", "asmenys") : plural(r.guests, "svečias", "svečiai"));
  return lines;
}

/** What was booked: each request with its service, date and time, nights, guests and price. */
export function PaymentRequests({ requests }: { requests: PaymentRequestView[] }) {
  if (requests.length === 0) return null;
  return (
    <ul aria-label="Rezervacijos duomenys" className="divide-y divide-line border-t border-dashed border-ink px-6">
      {requests.map((r) => (
        <li key={r.reference} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-4">
          <div className="min-w-0 space-y-1">
            {requests.length > 1 ? <p className="text-micro uppercase text-copy">{r.reference}</p> : null}
            <p className="font-bold">{r.title}</p>
            {detailLines(r).map((line) => (
              <p key={line} className="text-sm text-copy">{line}</p>
            ))}
          </div>
          <p className="font-display text-figure font-bold">{formatEuro(r.total)}</p>
        </li>
      ))}
    </ul>
  );
}
