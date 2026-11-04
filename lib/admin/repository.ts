import "server-only";
import { isPermissionId, type StaffAccess } from "@/lib/admin/permissions";
import type { ServerSupabase } from "@/lib/supabase/server";
import { toBlock, toBooking, toCoupon, toCouponProduct, toInquiry, toManagedEvent, toPriceItem, toQuadRental, toQuadSettings, toQuadType, toSauna, toSaunaProgram, toStaffMember, toStaffRole, toTourTicket, toUpsell } from "./mappers";
import { supabaseEnv } from "@/lib/supabase/env";
import type { AdminData } from "./types";

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

/** All dashboard data, read as the signed-in staff user. Throws if any query fails. */
export async function loadAdminData(supabase: ServerSupabase, me: StaffAccess): Promise<AdminData> {
  const [bookings, blocks, inquiries, events, prices, saunas, upsells, programs, coupons, couponProducts, quadTypes, quadSettings, quadRentals, tourTickets, eventTickets, roles, staff] = await Promise.all([
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
  ]);

  for (const res of [bookings, blocks, inquiries, events, prices, saunas, upsells, programs, coupons, couponProducts, quadTypes, quadSettings, quadRentals, tourTickets, eventTickets, roles, staff]) {
    if (res.error) throw new Error(`Admin data: ${res.error.message}`);
  }

  return {
    bookings: bookings.data!.map(toBooking),
    blocks: blocks.data!.map(toBlock),
    inquiries: inquiries.data!.map(toInquiry),
    events: events.data!.map(toManagedEvent),
    prices: prices.data!.map(toPriceItem),
    saunas: saunas.data!.map((r) => toSauna(r, r.sauna_upsell_links, supabaseEnv().url)),
    upsells: upsells.data!.map(toUpsell),
    programs: programs.data!.map(toSaunaProgram),
    coupons: coupons.data!.map(toCoupon),
    couponProducts: couponProducts.data!.map(toCouponProduct),
    quadTypes: quadTypes.data!.map(toQuadType),
    quadSettings: toQuadSettings(quadSettings.data!),
    quadRentals: quadRentals.data!.map(toQuadRental),
    tourTickets: tourTickets.data!.map(toTourTicket),
    eventTickets: eventTickets.data!.map(toTourTicket),
    me,
    roles: roles.data!.map(toStaffRole),
    // RLS already hides other people's rows from non-owners; this keeps the payload explicit.
    staff: me.isOwner ? staff.data!.map(toStaffMember) : [],
  };
}
