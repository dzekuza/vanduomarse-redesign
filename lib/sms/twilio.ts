import "server-only";

/**
 * SMS over the Twilio REST API (no SDK). Needs TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER (a Twilio number or alphanumeric
 * sender in E.164). Without them every send is skipped, so bookings never fail
 * because of a missing SMS setup.
 */

export const smsConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

/**
 * "8 612 34567", "00370 612 34567", "+370 612 34567" and "61234567" → "+37061234567".
 * Mirrors `private.norm_phone` in the database. Null when it is too short to dial.
 */
export function toE164(phone: string | null | undefined): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith("8")) digits = `370${digits.slice(1)}`;
  else if (digits.length === 8) digits = `370${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
}

/** Returns true when Twilio accepted the message. Never throws. */
export async function sendSms(to: string | null | undefined, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const number = toE164(to);
  if (!sid || !token || !from || !number) return false;

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: number, From: from, Body: body }),
    });
    // Log the status only: the response and the number are customer data.
    if (!res.ok) console.error(`Twilio SMS failed: HTTP ${res.status}`);
    return res.ok;
  } catch {
    console.error("Twilio SMS failed: network error");
    return false;
  }
}
