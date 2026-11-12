import "server-only";
import { headers } from "next/headers";

/**
 * The visitor's IP, for hashed per-IP send/order limits. Vercel's edge overwrites x-real-ip and
 * x-forwarded-for with the connecting client, so neither can be spoofed there. Behind another proxy,
 * revisit this: a client-set header would let one sender dodge the per-IP cap.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
