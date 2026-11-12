import "server-only";
import { pageContentSchema, type PageContentOverride } from "@/lib/page-content";
import { hasPermission, isPermissionId, type StaffAccess } from "@/lib/admin/permissions";
import type { ServerSupabase } from "@/lib/supabase/server";
import { toBlock, toBooking, toCoupon, toCouponProduct, toDiscountCode, toInquiry, toManagedEvent, toNotificationRecipient, toPaymentInfo, toPriceItem, toQuadTourAccessory, toSaunaMaster, toQuadTourRoute, toPurchase, toQuadRental, toQuadSettings, toQuadType, toStayType, toRider, toRiderCard, toRiderComment, toRiderDocument, toRiderSession, toRiderWaiver, toRidePlan, toSauna, toSaunaProgram, toStaffMember, toStaffRole, toTourTicket, toUpsell } from "./mappers";
import { supabaseEnv } from "@/lib/supabase/env";
import type { AdminData, SiteSettings } from "./types";

/**
 * Who is signed in, their staff row (everyone can read their own) and what their
 * role lets them open. `staff.active` false means switched off by an owner.
 */
export async function currentStaff(supabase: ServerSupabase) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, staff: null, access: null } as const;
  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, display_name, email, active, role_id, staff_roles(name, is_owner, permissions)")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!staff) return { user: auth.user, staff: null, access: null } as const;

  const role = staff.staff_roles;
  const access: StaffAccess = {
    userId: staff.user_id,
    name: staff.display_name,
    email: staff.email || auth.user.email || "",
    roleId: staff.role_id,
    roleName: role?.name ?? "",
    isOwner: role?.is_owner ?? false,
    permissions: (role?.permissions ?? []).filter(isPermissionId),
  };
  return { user: auth.user, staff, access } as const;
}

async function readQuadRentals(supabase: ServerSupabase) {
  const result = await supabase
    .from("quad_rentals")
    .select("*, quad_rental_items(quad_type_id, units)")
    .order("date").order("start_hour");

  // Keep single-type rentals readable until the mixed-rental relationship reaches the schema cache.
  return result.error?.code === "PGRST200"
    ? supabase.from("quad_rentals").select("*").order("date").order("start_hour")
    : result;
}

/**
 * Staff SMS recipients, owners only. Optional like discount codes: before the migration is applied the
 * table is missing and the screen shows an empty list (staff alerts then keep using STAFF_NOTIFY_PHONE).
 */
async function readNotificationRecipients(supabase: ServerSupabase, me: StaffAccess) {
  if (!me.isOwner) return [];
  const { data, error } = await supabase.from("notification_recipients").select("*").order("created_at");
  if (error) {
    console.error("Admin data: notification recipients", error.message);
    return [];
  }
  return data.map(toNotificationRecipient);
}

/** Site switches, owners only. Optional: before the site_settings migration the screen reads "unavailable". */
async function readSiteSettings(supabase: ServerSupabase, me: StaffAccess): Promise<SiteSettings | null> {
  if (!me.isOwner) return null;
  const { data, error } = await supabase.from("site_settings").select("coming_soon").limit(1).maybeSingle();
  if (error) {
    console.error("Admin data: site settings", error.message);
    return null;
  }
  return data ? { comingSoon: data.coming_soon } : null;
}

/** Saved service page overrides, owners only. An invalid row is left out (the public page falls back to its defaults). */
async function readPageContent(supabase: ServerSupabase, me: StaffAccess): Promise<Record<string, PageContentOverride>> {
  if (!me.isOwner) return {};
  const { data, error } = await supabase.from("page_content").select("slug, content");
  if (error) {
    console.error("Admin data: page content", error.message);
    return {};
  }
  const out: Record<string, PageContentOverride> = {};
  for (const row of data) {
    const parsed = pageContentSchema.safeParse(row.content);
    if (parsed.success) out[row.slug] = parsed.data;
  }
  return out;
}

/** Ids of customers who have a site account; empty without the Klientai / Apyrankės page or before the migration. */
async function readRiderAccountIds(supabase: ServerSupabase, me: StaffAccess): Promise<string[]> {
  if (!hasPermission(me, "klientai") && !hasPermission(me, "apyrankes")) return [];
  const { data, error } = await supabase.rpc("rider_accounts");
  if (error) {
    console.error("Admin data: rider accounts", error.message);
    return [];
  }
  return data.map((r) => r.rider_id);
}

/**
 * Discount codes and their usage, only for staff with the `nuolaidos` page. Optional like payments:
 * before the discount migration is applied the table is missing and the screen just shows no codes.
 */
async function readDiscountCodes(supabase: ServerSupabase, me: StaffAccess) {
  if (!hasPermission(me, "nuolaidos")) return [];
  const [codes, usage] = await Promise.all([
    supabase.from("discount_codes").select("*").order("created_at", { ascending: false }),
    supabase.rpc("discount_code_usage"),
  ]);
  if (codes.error) {
    console.error("Admin data: discount codes", codes.error.message);
    return [];
  }
  if (usage.error) console.error("Admin data: discount code usage", usage.error.message);
  const byId = new Map((usage.data ?? []).map((u) => [u.code_id, u]));
  return codes.data.map((r) => toDiscountCode(r, usage.error ? null : byId.get(r.id)));
}

/**
 * Open and recently-closed rider sessions, only for staff with the
 * `instruktorius` page. Bounded to the last day so the table (an append-only
 * scan log) never grows the payload — open sessions older than that are rare
 * (a lost/forgotten bracelet) and get closed by staff directly in the database.
 */
async function readRiderSessions(supabase: ServerSupabase, me: StaffAccess) {
  if (!hasPermission(me, "instruktorius")) return [];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("rider_sessions").select("*").gte("started_at", since).order("started_at", { ascending: false });
  if (error) {
    console.error("Admin data: rider sessions", error.message);
    return [];
  }
  return data.map(toRiderSession);
}

/** All dashboard data, read as the signed-in staff user. Throws if any query fails. */
export async function loadAdminData(supabase: ServerSupabase, me: StaffAccess): Promise<AdminData> {
  const [bookings, blocks, inquiries, events, prices, saunas, upsells, programs, coupons, couponProducts, stayTypes, quadTypes, quadSettings, quadRentals, tourTickets, eventTickets, roles, staff, payments, discountCodes, ridePlans, riders, riderCards, riderSessions, purchases, riderComments, riderDocuments, riderWaivers, quadTourRoutes, quadTourAccessories, saunaMasters] = await Promise.all([
    supabase.from("bookings").select("*, booking_extras(name, unit, quantity)").order("date").order("start_hour"),
    supabase.from("sauna_blocks").select("*").order("date").order("hour"),
    supabase.from("inquiries").select("*, inquiry_notes(text, created_at)").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("date").order("start_time"),
    supabase.from("price_items").select("*").order("sort_order"),
    supabase.from("saunas").select("*, sauna_upsell_links(upsell_id)").order("sort_order").order("created_at"),
    supabase.from("sauna_upsells").select("*").order("sort_order"),
    supabase.from("sauna_programs").select("*").order("sort_order"),
    supabase.from("coupons").select("*, coupon_redemptions(id, amount, note, created_at)").order("created_at", { ascending: false }),
    supabase.from("coupon_products").select("*").order("sort_order"),
    supabase.from("stay_types").select("*").order("sort_order"),
    supabase.from("quad_types").select("*").order("sort_order"),
    supabase.from("quad_settings").select("*").single(),
    readQuadRentals(supabase),
    supabase
      .from("event_tickets")
      .select("*, events!inner(title, date, start_time, category)")
      .eq("events.category", "keturratis")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_tickets")
      .select("*, events!inner(title, date, start_time, category)")
      .neq("events.category", "keturratis")
      .order("created_at", { ascending: false }),
    supabase.from("staff_roles").select("*").order("is_owner", { ascending: false }).order("name"),
    supabase.from("staff").select("*").order("created_at"),
    supabase.from("payments").select("*"),
    readDiscountCodes(supabase, me),
    supabase.from("ride_plans").select("*").order("sort_order"),
    // Supabase's REST API caps a response at 1000 rows regardless of table size; riders is
    // past that (8,900+, ADR-0041's Grabby import). Newest-first so a new signup — a
    // purchase, a bracelet sale, a /registracija self-registration — is always inside the
    // loaded window; the trade-off is that very old, never-revisited imported contacts past
    // row 1000 stop being loaded at all. A real fix is server-side search/pagination instead
    // of bulk-loading every rider into the client store; this is the stopgap until then.
    supabase.from("riders").select("*").order("created_at", { ascending: false }),
    supabase.from("rider_cards").select("*"),
    readRiderSessions(supabase, me),
    supabase.from("purchases").select("*").order("sold_at", { ascending: false }),
    supabase.from("rider_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("rider_documents").select("*").order("uploaded_at", { ascending: false }),
    supabase.from("rider_waivers").select("*").order("signed_at", { ascending: false }),
    supabase.from("quad_tour_routes").select("*").order("sort_order").order("id"),
    supabase.from("quad_tour_accessories").select("*").order("sort_order").order("id"),
    supabase.from("sauna_masters").select("*").order("sort_order").order("created_at"),
  ]);

  for (const res of [bookings, blocks, inquiries, events, prices, saunas, upsells, programs, coupons, couponProducts, stayTypes, quadTypes, quadSettings, quadRentals, tourTickets, eventTickets, roles, staff, ridePlans, riders, riderCards, purchases, riderComments, riderDocuments, riderWaivers, quadTourRoutes, quadTourAccessories]) {
    if (res.error) throw new Error(`Admin data: ${res.error.message}`);
  }

  // Payments are optional context: before the payments migration is applied the table is missing, and the lists just show no payment.
  const paymentById = new Map((payments.data ?? []).flatMap((row) => {
    const info = toPaymentInfo(row);
    return info ? [[row.id, info] as const] : [];
  }));
  const paymentOf = (id: string | null | undefined) => (id ? paymentById.get(id) : undefined);

  return {
    bookings: bookings.data!.map((r) => ({ ...toBooking(r), payment: paymentOf(r.payment_id) })),
    blocks: blocks.data!.map(toBlock),
    inquiries: inquiries.data!.map(toInquiry),
    events: events.data!.map(toManagedEvent),
    prices: prices.data!.map(toPriceItem),
    saunas: saunas.data!.map((r) => toSauna(r, r.sauna_upsell_links, supabaseEnv().url)),
    upsells: upsells.data!.map(toUpsell),
    // Optional context like payments: a database without the masters migration just has none.
    saunaMasters: (saunaMasters.data ?? []).map(toSaunaMaster),
    programs: programs.data!.map(toSaunaProgram),
    coupons: coupons.data!.map(toCoupon),
    couponProducts: couponProducts.data!.map(toCouponProduct),
    discountCodes,
    stayTypes: stayTypes.data!.map(toStayType),
    quadTypes: quadTypes.data!.map(toQuadType),
    quadSettings: toQuadSettings(quadSettings.data!),
    quadTourRoutes: quadTourRoutes.data!.map(toQuadTourRoute),
    quadTourAccessories: quadTourAccessories.data!.map(toQuadTourAccessory),
    quadRentals: quadRentals.data!.map((r) => ({ ...toQuadRental(r), payment: paymentOf(r.payment_id) })),
    tourTickets: tourTickets.data!.map((r) => ({ ...toTourTicket(r), payment: paymentOf(r.payment_id) })),
    eventTickets: eventTickets.data!.map((r) => ({ ...toTourTicket(r), payment: paymentOf(r.payment_id) })),
    me,
    roles: roles.data!.map(toStaffRole),
    // RLS already hides other people's rows from non-owners; this keeps the payload explicit.
    staff: me.isOwner ? staff.data!.map(toStaffMember) : [],
    notificationRecipients: await readNotificationRecipients(supabase, me),
    siteSettings: await readSiteSettings(supabase, me),
    pageContent: await readPageContent(supabase, me),
    ridePlans: ridePlans.data!.map(toRidePlan),
    riders: riders.data!.map(toRider),
    riderCards: riderCards.data!.map(toRiderCard),
    riderAccountIds: await readRiderAccountIds(supabase, me),
    riderSessions,
    purchases: purchases.data!.map(toPurchase),
    riderComments: riderComments.data!.map(toRiderComment),
    riderDocuments: riderDocuments.data!.map(toRiderDocument),
    riderWaivers: riderWaivers.data!.map(toRiderWaiver),
  };
}
