/** What the account page shows about one of the customer's requests (a sauna, stay, quad or event reservation). */
export interface MyRequest {
  id: string;
  reference: string;
  title: string;
  detail: string;
  /** yyyy-mm-dd */
  date: string;
  total: number;
  status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";
  /** The Stripe payment status, or null when it was not paid online. */
  payment: "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta" | null;
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
