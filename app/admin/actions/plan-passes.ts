"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  done,
  fail,
  staffClient,
  type ActionResult,
} from "@/lib/admin/action-helpers";
import { emailPassBalanceRequest } from "@/lib/email/notify";
import { openPassBalanceCheckout } from "@/lib/plan-pass-balance";

/**
 * The balance of a WAKE pass paid in parts (ADR-0139). Staff send the link when they choose (there is no deadline): "email"
 * sends it to the buyer, "copy" only returns it to pass on another way. Online passes belong to the Apyrankės page (its
 * permission reads them, ADR-0109), so that permission is required; the Checkout Session and the database call that remembers
 * it run with the service role after this check, as for staff payment links (ADR-0112).
 */
export async function getPassBalanceLink(
  passId: string,
  mode: "email" | "copy",
): Promise<ActionResult<{ url: string; emailSent?: boolean }>> {
  const parsed = z
    .object({ passId: z.uuid(), mode: z.enum(["email", "copy"]) })
    .safeParse({ passId, mode });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;

  const { data: pass, error } = await ctx.supabase
    .from("plan_passes")
    .select(
      "id, reference, plan_name, gift, buyer_name, buyer_email, status, payment_plan, balance_amount, balance_stripe_session_id",
    )
    .eq("id", passId)
    .maybeSingle();
  if (error) return fail("Nepavyko nuskaityti abonemento.", "db");
  if (!pass) return fail("Abonementas nerastas.", "invalid");
  if (
    pass.payment_plan !== "dalimis" ||
    pass.status !== "dalinai_apmoketa" ||
    pass.balance_amount === null
  ) {
    return fail(
      pass.status === "apmoketa" || pass.status === "priskirtas"
        ? "Abonementas jau apmokėtas visas."
        : "Šis abonementas nelaukia likučio.",
      "invalid",
    );
  }

  const link = await openPassBalanceCheckout({
    id: pass.id,
    reference: pass.reference,
    planName: pass.plan_name,
    gift: pass.gift,
    buyerEmail: pass.buyer_email,
    balance: Number(pass.balance_amount),
    balanceSessionId: pass.balance_stripe_session_id,
  });
  if (!link.ok) return fail(link.message, link.code);
  revalidatePath("/admin", "layout");
  if (mode === "copy") return done({ url: link.url });

  const emailSent = await emailPassBalanceRequest({
    to: pass.buyer_email,
    buyerName: pass.buyer_name,
    reference: pass.reference,
    planName: pass.plan_name,
    balance: Number(pass.balance_amount),
    url: link.url,
  });
  return done({ url: link.url, emailSent });
}
