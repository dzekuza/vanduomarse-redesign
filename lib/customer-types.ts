/** The signed-in customer as the reservation page needs it: who they are, never a token. */
export interface Customer {
  id: string;
  /** E.164, only when the account confirmed it with an SMS code. */
  phone: string | null;
  /** Only when the account confirmed it with an emailed code. */
  email: string | null;
  /** Saved from the last booking; empty for a brand-new account. */
  name: string;
}
