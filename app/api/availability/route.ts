import { getCustomer } from "@/lib/customer";
import {
  getCabinPageData,
  getQuadPageData,
  getSaunaPageData,
} from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import type { AvailabilityResponse } from "@/lib/data/availability-response";

export const runtime = "nodejs";

/**
 * Live availability and the signed-in customer for one activity's service page. The pages themselves are cached
 * (ISR); they call this on load so booked slots and the customer's session are always current. Never cached.
 */
export async function GET(request: Request) {
  const activity = new URL(request.url).searchParams.get("activity");
  const window = { days: RESERVATION_DAYS, now: new Date() };
  try {
    const [data, customer] = await Promise.all([
      activity === "pirtis"
        ? getSaunaPageData(window)
        : activity === "nakvyne"
          ? getCabinPageData(window)
          : activity === "keturraciai"
            ? getQuadPageData(window)
            : null,
      getCustomer(),
    ]);
    if (!data)
      return Response.json({ error: "Unknown activity" }, { status: 400 });
    return Response.json({ activity, data, customer } as AvailabilityResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("Availability failed", e);
    return Response.json(
      { error: "Availability failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
