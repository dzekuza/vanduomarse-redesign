export type RequestKind = "pirtis" | "nakvyne" | "keturraciai" | "renginys";

/** What the account page shows about one of the customer's requests (a sauna, stay, quad or event reservation). */
export interface MyRequest {
  id: string;
  reference: string;
  title: string;
  /** Which tab of the account page it belongs to. */
  kind: RequestKind;
  detail: string;
  /** yyyy-mm-dd */
  date: string;
  total: number;
  status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";
  /** The Stripe payment status, or null when it was not paid online. */
  payment: "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta" | null;
  /** The Stripe payment this request belongs to; lets an unpaid one be paid again or cancelled. */
  paymentId: string | null;
}

export const REQUEST_STATUS_LABEL: Record<MyRequest["status"], string> = {
  laukia: "Laukia patvirtinimo",
  patvirtinta: "Patvirtinta",
  ivykdyta: "Įvykdyta",
  atsaukta: "Atšaukta",
};

export const REQUEST_PAYMENT_LABEL: Record<NonNullable<MyRequest["payment"]>, string> = {
  laukia: "Laukia apmokėjimo",
  apmoketa: "Apmokėta",
  pasibaige: "Mokėjimo laikas baigėsi",
  nepavyko: "Mokėjimas nepavyko",
  grazinta: "Grąžinta",
};

/** A calculator quote the customer sent (matched by their confirmed e-mail or phone, see `my_inquiries()`). */
export interface MyInquiry {
  id: string;
  /** ISO timestamp */
  createdAt: string;
  eventType: string;
  /** yyyy-mm-dd, empty when none was chosen */
  date: string;
  guests: number;
  space: string;
  estimate: { min: number; max: number } | null;
  status: "nauja" | "susisiekta" | "pasiulymas";
  /** Staff accepted it and held the cabins and saunas. */
  accepted: boolean;
  /** The comment they wrote. */
  message: string;
  /** The estimate breakdown they were shown, grouped like the calculator. */
  lines: { group: string; label: string; amount: { min: number; max: number } }[];
  contact: { name: string; phone: string; email: string };
}

export const INQUIRY_STATUS_LABEL: Record<MyInquiry["status"], string> = {
  nauja: "Gauta",
  susisiekta: "Susisiekėme",
  pasiulymas: "Pateiktas pasiūlymas",
};

/** The customer's wakeboard rider record (matched by confirmed e-mail or phone, see `my_riders()`): plan, bracelet and purchases. */
export interface MyRider {
  id: string;
  name: string;
  surname: string;
  /** The plan they are on now; null until staff sell them one. */
  plan: { name: string; description: string; category: string; price: number | null } | null;
  /** Bracelet numbers bound to them. */
  cards: string[];
  /** Plans bought, newest first. */
  purchases: { planName: string; category: string; price: number | null; soldAt: string }[];
}
