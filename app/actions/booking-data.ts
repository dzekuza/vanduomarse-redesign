"use server";

import type { ActionResult } from "@/app/admin/actions";
import { CABIN_DAYS, SAUNA_DAYS, getCabinPageData, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import type { CabinPageData, QuadPageData, SaunaPageData } from "@/lib/data/public-types";

/** Activities of the home page that have an online booking form. */
export type BookableKind = "sauna" | "cabins" | "ciongo";

export type BookingData =
  | { kind: "sauna"; data: SaunaPageData; days: number }
  | { kind: "cabins"; data: CabinPageData; days: number }
  | { kind: "ciongo"; data: QuadPageData };

/**
 * Live availability for the booking form inside a home page dialog, loaded when
 * the dialog opens so the home page itself stays static. Same readers as the
 * /pirtis, /miegas and /keturraciai pages.
 */
export async function loadBookingData(kind: BookableKind): Promise<ActionResult<BookingData>> {
  try {
    if (kind === "sauna") return { data: { kind, data: await getSaunaPageData(), days: SAUNA_DAYS } };
    if (kind === "cabins") return { data: { kind, data: await getCabinPageData(), days: CABIN_DAYS } };
    if (kind === "ciongo") return { data: { kind, data: await getQuadPageData() } };
  } catch {
    return { error: { message: "Nepavyko įkelti rezervacijos. Bandykite dar kartą.", code: "load" } };
  }
  return { error: { message: "Nežinoma veikla.", code: "invalid" } };
}
