/**
 * Sauna masters (pirtininkai): named people a customer can add to a private sauna
 * booking or program. Rows of `public.sauna_masters`, edited in /admin/pirtis.
 * The price is per booking, incl. 21% PVM, and is added on top of the session.
 */
export interface SaunaMaster {
  id: string;
  name: string;
  description: string;
  /** EUR per booking. */
  price: number;
  /** Shortest hourly session he works; programs are not limited by it. */
  minHours: number;
  active: boolean;
  sortOrder: number;
}

/** "Jonas · +250 €" for a picker option. */
export function masterOptionLabel(m: Pick<SaunaMaster, "name" | "price">): string {
  return `${m.name} · +${String(m.price).replace(".", ",")} €`;
}
