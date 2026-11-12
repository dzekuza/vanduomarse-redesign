import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { dbError, fail, type ActionResult } from "@/lib/admin/action-helpers";
import { isPermissionId, type PermissionId } from "@/lib/admin/permissions";
import type { BookingStatus } from "@/lib/admin/types";
import { sendCouponEmails } from "@/lib/email/send-coupon";
import { notifyRequestOutcome } from "@/lib/notify";
import { refundRequest } from "@/lib/refund";
import { describeRequest, saunaSummary } from "@/lib/sms/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Staff API endpoint for the React Native mobile admin app (`mobile/`).
 *
 * Most mobile reads and writes go straight to Supabase using the staff member's
 * JWT + RLS. The actions here are the ones that ALSO need server-only side effects
 * (Twilio customer SMS, Resend customer emails, Stripe refunds, Next.js cache
 * revalidation):
 *   - setBookingStatus
 *   - setRentalStatus
 *   - setTourTicketStatus
 *   - cancelRequest (with optional Stripe refund)
 *   - activateCoupon (issues code + sends coupon email)
 *   - resendCouponEmail
 */

const bookingStatus = z.enum(["laukia", "patvirtinta", "ivykdyta", "atsaukta"]);

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setBookingStatus"), id: z.uuid(), status: bookingStatus }),
  z.object({ action: z.literal("setRentalStatus"), id: z.uuid(), status: bookingStatus }),
  z.object({ action: z.literal("setTourTicketStatus"), id: z.uuid(), status: bookingStatus }),
  z.object({
    action: z.literal("cancelRequest"),
    kind: z.enum(["booking", "rental", "ticket"]),
    id: z.uuid(),
    refund: z.boolean(),
  }),
  z.object({ action: z.literal("activateCoupon"), id: z.uuid() }),
  z.object({ action: z.literal("resendCouponEmail"), id: z.uuid() }),
]);

export type MobileActionPayload = z.infer<typeof requestSchema>;

async function bearerStaffClient(
  request: NextRequest,
  need: PermissionId | readonly PermissionId[],
) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false as const, error: fail("Prisijunkite iš naujo.", "unauthorized"), status: 401 };

  const { url, anonKey } = supabaseEnv();
  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) {
    return { ok: false as const, error: fail("Prisijunkite iš naujo.", "unauthorized"), status: 401 };
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("active, staff_roles(is_owner, permissions)")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!staff || !staff.active) {
    return { ok: false as const, error: fail("Neturite prieigos.", "forbidden"), status: 403 };
  }

  const isOwner = staff.staff_roles?.is_owner ?? false;
  const granted = (staff.staff_roles?.permissions ?? []).filter(isPermissionId);
  const wanted: readonly PermissionId[] = typeof need === "string" ? [need] : need;
  const allowed = isOwner || wanted.some((p) => granted.includes(p));

  if (!allowed) {
    return { ok: false as const, error: fail("Neturite teisės šiam veiksmui.", "forbidden"), status: 403 };
  }

  return { ok: true as const, supabase, userId: auth.user.id, isOwner };
}

async function accountEmailFor(userId: string | null, rowEmail: string | null): Promise<string | null> {
  if (!userId || !rowEmail) return null;
  try {
    const { data, error } = await createAdminClient().rpc("account_notify_email", { p_user: userId });
    if (error || !data) return null;
    return data.toLowerCase() === rowEmail.trim().toLowerCase() ? data : null;
  } catch {
    return null;
  }
}

function notifyCustomer(
  source: string,
  contact: { customer_phone: string | null; customer_email: string | null; user_id: string | null },
  reference: string,
  status: BookingStatus,
  summary: string,
) {
  if (source !== "svetaine" || (status !== "patvirtinta" && status !== "atsaukta")) return;
  after(async () => {
    const email = await accountEmailFor(contact.user_id, contact.customer_email);
    await notifyRequestOutcome({ phone: contact.customer_phone, email }, reference, status, summary);
  });
}

function done<T>(data: T): NextResponse<ActionResult<T>> {
  revalidatePath("/admin", "layout");
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(fail("Netinkama užklausa.", "invalid"), { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(fail("Netinkamos reikšmės.", "invalid"), { status: 400 });
  }

  const body = parsed.data;

  switch (body.action) {
    case "setBookingStatus": {
      const ctx = await bearerStaffClient(request, "rezervacijos");
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });
      const { data, error } = await ctx.supabase
        .from("bookings")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("reference, customer_phone, customer_email, user_id, source, kind, date, start_hour, hours")
        .maybeSingle();
      if (error) return NextResponse.json(dbError(error), { status: 400 });
      if (data) {
        const summary =
          data.start_hour !== null && data.hours !== null
            ? saunaSummary({ date: data.date, startHour: data.start_hour, hours: data.hours })
            : describeRequest([data.kind === "pirtis" ? "Pirtis" : "Nakvyne", data.date]);
        notifyCustomer(data.source, data, data.reference, body.status, summary);
      }
      return done(null);
    }

    case "setRentalStatus": {
      const ctx = await bearerStaffClient(request, "keturraciai");
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });
      const { data, error } = await ctx.supabase
        .from("quad_rentals")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("reference, customer_phone, customer_email, user_id, source, date, start_hour")
        .maybeSingle();
      if (error) return NextResponse.json(dbError(error), { status: 400 });
      if (data) {
        notifyCustomer(
          data.source,
          data,
          data.reference,
          body.status,
          describeRequest(["Keturraciai", data.date, `${String(data.start_hour).padStart(2, "0")}:00`]),
        );
      }
      return done(null);
    }

    case "setTourTicketStatus": {
      const ctx = await bearerStaffClient(request, ["keturraciai", "renginiai"]);
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });
      const { data, error } = await ctx.supabase
        .from("event_tickets")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("reference, customer_phone, customer_email, user_id, source, people")
        .maybeSingle();
      if (error) return NextResponse.json(dbError(error), { status: 400 });
      if (data) {
        notifyCustomer(data.source, data, data.reference, body.status, describeRequest(["Bilietai", `${data.people} asm.`]));
      }
      return done(null);
    }

    case "cancelRequest": {
      const need =
        body.kind === "booking" ? "rezervacijos" : body.kind === "rental" ? "keturraciai" : (["keturraciai", "renginiai"] as const);
      const ctx = await bearerStaffClient(request, need);
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });

      if (body.kind === "booking") {
        const { data, error } = await ctx.supabase
          .from("bookings")
          .update({ status: "atsaukta" })
          .eq("id", body.id)
          .select("reference, customer_phone, customer_email, user_id, source, kind, date, start_hour, hours, status")
          .maybeSingle();
        if (error) return NextResponse.json(dbError(error), { status: 400 });
        if (!data || data.status !== "atsaukta") {
          return NextResponse.json(fail("Užklausos atšaukti nepavyko.", "not_cancelled"), { status: 400 });
        }
        const summary =
          data.start_hour !== null && data.hours !== null
            ? saunaSummary({ date: data.date, startHour: data.start_hour, hours: data.hours })
            : describeRequest([data.kind === "pirtis" ? "Pirtis" : "Nakvyne", data.date]);
        notifyCustomer(data.source, data, data.reference, "atsaukta", summary);
      } else if (body.kind === "rental") {
        const { data, error } = await ctx.supabase
          .from("quad_rentals")
          .update({ status: "atsaukta" })
          .eq("id", body.id)
          .select("reference, customer_phone, customer_email, user_id, source, date, start_hour, status")
          .maybeSingle();
        if (error) return NextResponse.json(dbError(error), { status: 400 });
        if (!data || data.status !== "atsaukta") {
          return NextResponse.json(fail("Užklausos atšaukti nepavyko.", "not_cancelled"), { status: 400 });
        }
        notifyCustomer(
          data.source,
          data,
          data.reference,
          "atsaukta",
          describeRequest(["Keturraciai", data.date, `${String(data.start_hour).padStart(2, "0")}:00`]),
        );
      } else {
        const { data, error } = await ctx.supabase
          .from("event_tickets")
          .update({ status: "atsaukta" })
          .eq("id", body.id)
          .select("reference, customer_phone, customer_email, user_id, source, people, status")
          .maybeSingle();
        if (error) return NextResponse.json(dbError(error), { status: 400 });
        if (!data || data.status !== "atsaukta") {
          return NextResponse.json(fail("Užklausos atšaukti nepavyko.", "not_cancelled"), { status: 400 });
        }
        notifyCustomer(data.source, data, data.reference, "atsaukta", describeRequest(["Bilietai", `${data.people} asm.`]));
      }

      if (!body.refund) return done({ refunded: 0 });
      const outcome = await refundRequest(body.kind, body.id, ctx.userId);
      return done(outcome.ok ? { refunded: outcome.amount } : { refunded: 0, refundError: outcome.message });
    }

    case "activateCoupon": {
      const ctx = await bearerStaffClient(request, "kuponai");
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });
      const { data, error } = await ctx.supabase.rpc("activate_coupon", { p_id: body.id });
      if (error) return NextResponse.json(dbError(error), { status: 400 });
      const issued = data[0];
      const { data: c } = await ctx.supabase.from("coupons").select("*").eq("id", body.id).single();
      const emailSent = c
        ? await sendCouponEmails({
            to: c.buyer_email,
            recipientEmail: c.recipient_email,
            buyerName: c.buyer_name,
            recipientName: c.recipient_name,
            message: c.message,
            code: issued.code,
            productName: c.product_name,
            faceValue: c.face_value,
            service: c.service,
            expiresAt: issued.expires_at,
          })
        : false;
      return done({ code: issued.code, expiresAt: issued.expires_at, emailSent });
    }

    case "resendCouponEmail": {
      const ctx = await bearerStaffClient(request, "kuponai");
      if (!ctx.ok) return NextResponse.json(ctx.error, { status: ctx.status });
      const { data: c, error } = await ctx.supabase.from("coupons").select("*").eq("id", body.id).single();
      if (error) return NextResponse.json(dbError(error), { status: 400 });
      if (c.status !== "aktyvus" || !c.code || !c.expires_at) {
        return NextResponse.json(fail("Kodas išsiunčiamas tik aktyviam kuponui.", "invalid"), { status: 400 });
      }
      const emailSent = await sendCouponEmails({
        to: c.buyer_email,
        recipientEmail: c.recipient_email,
        buyerName: c.buyer_name,
        recipientName: c.recipient_name,
        message: c.message,
        code: c.code,
        productName: c.product_name,
        faceValue: c.face_value,
        service: c.service,
        expiresAt: c.expires_at,
      });
      return NextResponse.json({ data: { emailSent } });
    }
  }
}
