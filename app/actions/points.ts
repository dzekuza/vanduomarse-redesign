"use server";

import type { SpendablePoints } from "@/lib/points";
import { createClient } from "@/lib/supabase/server";

/**
 * The points the signed-in customer can spend at checkout and what one is worth (ADR-0122), read through their own session.
 * Null when signed out, points are off, or the lookup fails: the checkout then simply offers no points.
 */
export async function loadSpendablePoints(): Promise<SpendablePoints | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_spendable_points");
  const row = data?.[0];
  if (error || !row) return null;
  return { balance: row.balance, pointValueEur: Number(row.point_value_eur), enabled: row.enabled };
}
