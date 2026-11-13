"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";
import * as actions from "@/app/admin/actions";
import * as discountActions from "@/app/admin/discount-actions";
import * as notificationActions from "@/app/admin/notification-actions";
import * as pageContentActions from "@/app/admin/page-content-actions";
import * as siteSettingsActions from "@/app/admin/site-settings-actions";
import * as staffActions from "@/app/admin/staff-actions";
import { formatEuro } from "@/lib/coupons";
import type { ActionResult, NewBookingInput, StaffRentalInput } from "@/app/admin/actions";
import type { PermissionId } from "@/lib/admin/permissions";
import type { RiderProfileInput } from "@/app/admin/actions";
import type { AdminData, Booking, BookingStatus, InquiryStatus, ManagedEvent, PriceItem, Purchase, QuadRental, Rider, RiderComment, RiderDocument, RidePlan, RiderSession, StaffMember, StaffRole, TourTicket } from "@/lib/admin/types";
import type { CouponProduct } from "@/lib/coupons";
import type { PageContentOverride } from "@/lib/page-content";
import type { DiscountCodeInput } from "@/lib/discount-code-schema";
import type { NotificationRecipientInput } from "@/lib/notification-recipient-schema";
import type { StayType } from "@/lib/cabin";
import type { QuadSettings, QuadTourAccessory, QuadTourRoute, QuadType } from "@/lib/quads";
import type { SaunaValues } from "./sauna/sauna-schema";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { SaunaMaster } from "@/lib/sauna-masters";
import type { Upsell } from "@/lib/sauna-upsells";

/**
 * Admin data from Supabase (loaded in the admin layout). Every screen talks to
 * these actions only: each applies its change optimistically, runs the server
 * action, and the revalidated layout then resets the store to what the
 * database holds. A failed write shows a toast and is rolled back by that reset.
 */

type Action =
  | { type: "reset"; data: AdminData }
  | { type: "booking/status"; id: string; status: BookingStatus }
  | { type: "booking/add"; booking: Booking }
  | { type: "block/toggle"; saunaId: string; date: string; hour: number; reason: string }
  | { type: "inquiry/status"; id: string; status: InquiryStatus }
  | { type: "inquiry/note"; id: string; text: string }
  | { type: "inquiry/accepted"; id: string; acceptedAt?: string }
  | { type: "event/upsert"; event: ManagedEvent }
  | { type: "event/delete"; id: string }
  | { type: "event/publish"; id: string; published: boolean }
  | { type: "event/held"; id: string; held: number }
  | { type: "prices/update"; items: PriceItem[] }
  | { type: "sauna/active"; id: string; active: boolean }
  | { type: "sauna/order"; ids: string[] }
  | { type: "sauna/delete"; id: string }
  | { type: "sauna/photos"; id: string; paths: string[] }
  | { type: "upsell/upsert"; upsell: Upsell }
  | { type: "upsell/delete"; id: string }
  | { type: "master/upsert"; master: SaunaMaster }
  | { type: "master/delete"; id: string }
  | { type: "program/upsert"; program: SaunaProgram }
  | { type: "program/delete"; id: string }
  | { type: "coupon/cancel"; id: string }
  | { type: "coupon/refunded"; id: string; amount: number }
  | { type: "couponProduct/upsert"; product: CouponProduct }
  | { type: "couponProduct/delete"; id: string }
  | { type: "discountCode/active"; id: string; active: boolean }
  | { type: "discountCode/delete"; id: string }
  | { type: "siteSettings/comingSoon"; enabled: boolean }
  | { type: "pageContent/set"; slug: string; content: PageContentOverride }
  | { type: "notifications/read"; readAt: string }
  | { type: "notificationRecipient/active"; id: string; active: boolean }
  | { type: "notificationRecipient/delete"; id: string }
  | { type: "request/delete"; kind: "booking" | "rental" | "ticket"; id: string }
  | { type: "rental/status"; id: string; status: BookingStatus }
  | { type: "rental/add"; rental: QuadRental }
  | { type: "ticket/status"; id: string; status: BookingStatus }
  | { type: "stayType/upsert"; stayType: StayType }
  | { type: "stayType/delete"; id: string }
  | { type: "quadType/upsert"; quadType: QuadType }
  | { type: "quadType/delete"; id: string }
  | { type: "quadTourRoute/upsert"; route: QuadTourRoute }
  | { type: "quadTourRoute/delete"; id: string }
  | { type: "quadTourAccessory/upsert"; accessory: QuadTourAccessory }
  | { type: "quadTourAccessory/delete"; id: string }
  | { type: "quadSettings"; settings: QuadSettings }
  | { type: "staff/add"; member: StaffMember }
  | { type: "staff/role"; userId: string; roleId: string }
  | { type: "staff/active"; userId: string; active: boolean }
  | { type: "staff/remove"; userId: string }
  | { type: "role/upsert"; role: StaffRole }
  | { type: "role/delete"; id: string }
  | { type: "ridePlan/upsert"; plan: RidePlan }
  | { type: "ridePlan/delete"; id: string }
  | { type: "rider/add"; rider: Rider }
  | { type: "rider/plan"; id: string; planId: string }
  | { type: "rider/profile"; rider: Rider }
  | { type: "rider/avatar"; id: string; avatarPath: string | null }
  | { type: "rider/delete"; id: string }
  | { type: "riderCard/bind"; cardNumber: string; riderId: string }
  | { type: "riderSession/scan"; session: RiderSession }
  | { type: "purchase/add"; purchase: Purchase }
  | { type: "riderComment/add"; comment: RiderComment }
  | { type: "riderComment/delete"; id: string }
  | { type: "riderDocument/add"; document: RiderDocument }
  | { type: "riderDocument/delete"; id: string };

function reducer(state: AdminData, action: Action): AdminData {
  switch (action.type) {
    case "reset":
      return action.data;
    case "booking/status":
      return { ...state, bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, status: action.status } : b)) };
    case "booking/add":
      return { ...state, bookings: [...state.bookings, action.booking] };
    case "block/toggle": {
      const same = (b: { saunaId: string; date: string; hour: number }) => b.saunaId === action.saunaId && b.date === action.date && b.hour === action.hour;
      return {
        ...state,
        blocks: state.blocks.some(same)
          ? state.blocks.filter((b) => !same(b))
          : [
              ...state.blocks,
              { id: `pending-${action.saunaId}-${action.date}-${action.hour}`, saunaId: action.saunaId, date: action.date, hour: action.hour, reason: action.reason },
            ],
      };
    }
    case "inquiry/status":
      return { ...state, inquiries: state.inquiries.map((q) => (q.id === action.id ? { ...q, status: action.status } : q)) };
    case "inquiry/accepted":
      return { ...state, inquiries: state.inquiries.map((q) => (q.id === action.id ? { ...q, acceptedAt: action.acceptedAt } : q)) };
    case "inquiry/note":
      return {
        ...state,
        inquiries: state.inquiries.map((q) =>
          q.id === action.id ? { ...q, notes: [...q.notes, { at: new Date().toISOString(), text: action.text }] } : q,
        ),
      };
    case "event/upsert": {
      const exists = state.events.some((e) => e.id === action.event.id);
      const events = exists ? state.events.map((e) => (e.id === action.event.id ? action.event : e)) : [...state.events, action.event];
      return { ...state, events: events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) };
    }
    case "event/delete":
      return { ...state, events: state.events.filter((e) => e.id !== action.id) };
    case "event/held":
      return { ...state, events: state.events.map((e) => (e.id === action.id ? { ...e, held: action.held } : e)) };
    case "event/publish":
      return { ...state, events: state.events.map((e) => (e.id === action.id ? { ...e, published: action.published } : e)) };
    case "prices/update": {
      const next = new Map(action.items.map((i) => [i.id, i]));
      return { ...state, prices: state.prices.map((p) => next.get(p.id) ?? p) };
    }
    case "sauna/active":
      return { ...state, saunas: state.saunas.map((s) => (s.id === action.id ? { ...s, active: action.active, comingSoon: false } : s)) };
    case "sauna/order": {
      const at = new Map(action.ids.map((id, i) => [id, i]));
      return { ...state, saunas: [...state.saunas].sort((a, b) => (at.get(a.id) ?? 0) - (at.get(b.id) ?? 0)) };
    }
    case "sauna/delete":
      return { ...state, saunas: state.saunas.filter((s) => s.id !== action.id) };
    case "sauna/photos":
      return {
        ...state,
        saunas: state.saunas.map((s) =>
          s.id === action.id ? { ...s, photos: action.paths.flatMap((p) => s.photos.filter((ph) => ph.path === p)) } : s,
        ),
      };
    case "upsell/upsert": {
      const exists = state.upsells.some((u) => u.id === action.upsell.id);
      return {
        ...state,
        upsells: exists ? state.upsells.map((u) => (u.id === action.upsell.id ? action.upsell : u)) : [...state.upsells, action.upsell],
      };
    }
    case "upsell/delete":
      return { ...state, upsells: state.upsells.filter((u) => u.id !== action.id) };
    case "master/upsert": {
      const exists = state.saunaMasters.some((m) => m.id === action.master.id);
      return {
        ...state,
        saunaMasters: exists ? state.saunaMasters.map((m) => (m.id === action.master.id ? action.master : m)) : [...state.saunaMasters, action.master],
      };
    }
    case "master/delete":
      return { ...state, saunaMasters: state.saunaMasters.filter((m) => m.id !== action.id) };
    case "program/upsert": {
      const exists = state.programs.some((p) => p.id === action.program.id);
      const programs = exists ? state.programs.map((p) => (p.id === action.program.id ? action.program : p)) : [...state.programs, action.program];
      return { ...state, programs: programs.sort((a, b) => a.sortOrder - b.sortOrder) };
    }
    case "program/delete":
      return { ...state, programs: state.programs.filter((p) => p.id !== action.id) };
    case "coupon/cancel":
      return { ...state, coupons: state.coupons.map((c) => (c.id === action.id ? { ...c, status: "atsauktas" } : c)) };
    case "coupon/refunded":
      return { ...state, coupons: state.coupons.map((c) => (c.id === action.id ? { ...c, refundedAmount: action.amount } : c)) };
    case "couponProduct/upsert": {
      const exists = state.couponProducts.some((p) => p.id === action.product.id);
      return {
        ...state,
        couponProducts: exists
          ? state.couponProducts.map((p) => (p.id === action.product.id ? action.product : p))
          : [...state.couponProducts, action.product],
      };
    }
    case "couponProduct/delete":
      return { ...state, couponProducts: state.couponProducts.filter((p) => p.id !== action.id) };
    case "discountCode/active":
      return { ...state, discountCodes: state.discountCodes.map((d) => (d.id === action.id ? { ...d, active: action.active } : d)) };
    case "discountCode/delete":
      return { ...state, discountCodes: state.discountCodes.filter((d) => d.id !== action.id) };
    case "siteSettings/comingSoon":
      return state.siteSettings ? { ...state, siteSettings: { ...state.siteSettings, comingSoon: action.enabled } } : state;
    case "pageContent/set": {
      const rest = Object.fromEntries(Object.entries(state.pageContent).filter(([slug]) => slug !== action.slug));
      return { ...state, pageContent: Object.keys(action.content).length ? { ...rest, [action.slug]: action.content } : rest };
    }
    case "notifications/read":
      return { ...state, notificationsReadAt: action.readAt };
    case "notificationRecipient/active":
      return { ...state, notificationRecipients: state.notificationRecipients.map((n) => (n.id === action.id ? { ...n, active: action.active } : n)) };
    case "notificationRecipient/delete":
      return { ...state, notificationRecipients: state.notificationRecipients.filter((n) => n.id !== action.id) };
    case "request/delete":
      return action.kind === "booking"
        ? { ...state, bookings: state.bookings.filter((b) => b.id !== action.id) }
        : action.kind === "rental"
          ? { ...state, quadRentals: state.quadRentals.filter((r) => r.id !== action.id) }
          : { ...state, tourTickets: state.tourTickets.filter((t) => t.id !== action.id), eventTickets: state.eventTickets.filter((t) => t.id !== action.id) };
    case "rental/status":
      return { ...state, quadRentals: state.quadRentals.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) };
    case "rental/add":
      return { ...state, quadRentals: [...state.quadRentals, action.rental] };
    case "ticket/status": {
      const apply = (t: TourTicket) => (t.id === action.id ? { ...t, status: action.status } : t);
      return { ...state, tourTickets: state.tourTickets.map(apply), eventTickets: state.eventTickets.map(apply) };
    }
    case "stayType/upsert": {
      const rest = state.stayTypes.filter((t) => t.id !== action.stayType.id);
      return { ...state, stayTypes: [...rest, action.stayType].toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)) };
    }
    case "stayType/delete":
      return { ...state, stayTypes: state.stayTypes.filter((t) => t.id !== action.id) };
    case "quadType/upsert": {
      const exists = state.quadTypes.some((t) => t.id === action.quadType.id);
      return {
        ...state,
        quadTypes: exists ? state.quadTypes.map((t) => (t.id === action.quadType.id ? action.quadType : t)) : [...state.quadTypes, action.quadType],
      };
    }
    case "quadType/delete":
      return { ...state, quadTypes: state.quadTypes.filter((t) => t.id !== action.id) };
    case "quadTourRoute/upsert": {
      const rest = state.quadTourRoutes.filter((r) => r.id !== action.route.id);
      return { ...state, quadTourRoutes: [...rest, action.route].toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)) };
    }
    case "quadTourRoute/delete":
      return { ...state, quadTourRoutes: state.quadTourRoutes.filter((r) => r.id !== action.id) };
    case "quadTourAccessory/upsert": {
      const rest = state.quadTourAccessories.filter((a) => a.id !== action.accessory.id);
      return { ...state, quadTourAccessories: [...rest, action.accessory].toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)) };
    }
    case "quadTourAccessory/delete":
      return { ...state, quadTourAccessories: state.quadTourAccessories.filter((a) => a.id !== action.id) };
    case "quadSettings":
      return { ...state, quadSettings: action.settings };
    case "staff/add":
      return { ...state, staff: [...state.staff, action.member] };
    case "staff/role":
      return { ...state, staff: state.staff.map((m) => (m.userId === action.userId ? { ...m, roleId: action.roleId } : m)) };
    case "staff/active":
      return { ...state, staff: state.staff.map((m) => (m.userId === action.userId ? { ...m, active: action.active } : m)) };
    case "staff/remove":
      return { ...state, staff: state.staff.filter((m) => m.userId !== action.userId) };
    case "role/upsert": {
      const exists = state.roles.some((r) => r.id === action.role.id);
      return { ...state, roles: exists ? state.roles.map((r) => (r.id === action.role.id ? action.role : r)) : [...state.roles, action.role] };
    }
    case "role/delete":
      return { ...state, roles: state.roles.filter((r) => r.id !== action.id) };
    case "ridePlan/upsert": {
      const exists = state.ridePlans.some((p) => p.id === action.plan.id);
      const ridePlans = exists ? state.ridePlans.map((p) => (p.id === action.plan.id ? action.plan : p)) : [...state.ridePlans, action.plan];
      return { ...state, ridePlans: ridePlans.toSorted((a, b) => a.sortOrder - b.sortOrder) };
    }
    case "ridePlan/delete":
      return { ...state, ridePlans: state.ridePlans.filter((p) => p.id !== action.id) };
    case "rider/add":
      return { ...state, riders: [...state.riders, action.rider] };
    case "rider/plan":
      return { ...state, riders: state.riders.map((r) => (r.id === action.id ? { ...r, planId: action.planId } : r)) };
    case "rider/profile":
      return { ...state, riders: state.riders.map((r) => (r.id === action.rider.id ? action.rider : r)) };
    case "rider/avatar":
      return { ...state, riders: state.riders.map((r) => (r.id === action.id ? { ...r, avatarPath: action.avatarPath } : r)) };
    case "rider/delete":
      return {
        ...state,
        riders: state.riders.filter((r) => r.id !== action.id),
        riderCards: state.riderCards.filter((c) => c.riderId !== action.id),
        purchases: state.purchases.filter((p) => p.riderId !== action.id),
        riderComments: state.riderComments.filter((c) => c.riderId !== action.id),
        riderDocuments: state.riderDocuments.filter((d) => d.riderId !== action.id),
        riderWaivers: state.riderWaivers.filter((w) => w.riderId !== action.id),
      };
    case "riderCard/bind":
      return {
        ...state,
        riderCards: [
          ...state.riderCards.filter((c) => c.cardNumber !== action.cardNumber && c.riderId !== action.riderId),
          { cardNumber: action.cardNumber, riderId: action.riderId, boundAt: new Date().toISOString() },
        ],
      };
    case "riderSession/scan":
      return {
        ...state,
        riderSessions: [action.session, ...state.riderSessions.filter((s) => s.id !== action.session.id)],
      };
    case "purchase/add":
      return { ...state, purchases: [action.purchase, ...state.purchases] };
    case "riderComment/add":
      return { ...state, riderComments: [action.comment, ...state.riderComments] };
    case "riderComment/delete":
      return { ...state, riderComments: state.riderComments.filter((c) => c.id !== action.id) };
    case "riderDocument/add":
      return { ...state, riderDocuments: [action.document, ...state.riderDocuments] };
    case "riderDocument/delete":
      return { ...state, riderDocuments: state.riderDocuments.filter((d) => d.id !== action.id) };
  }
}

/** Toast on failure; returns whether the write succeeded. */
async function report<T>(pending: Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const result = await pending;
  if ("error" in result) toast.error(result.error.message);
  return result;
}

function useAdminReducer(initial: AdminData) {
  const [state, dispatch] = useReducer(reducer, initial);

  // The layout re-renders after every server action; adopt the fresh data.
  useEffect(() => dispatch({ type: "reset", data: initial }), [initial]);

  const api = useMemo(
    () => ({
      setBookingStatus: (id: string, status: BookingStatus) => {
        dispatch({ type: "booking/status", id, status });
        return report(actions.setBookingStatus(id, status));
      },
      /** Not optimistic: the reference comes from the database. */
      createBooking: async (input: NewBookingInput) => {
        const result = await actions.createBooking(input);
        if ("data" in result) dispatch({ type: "booking/add", booking: result.data });
        return result;
      },
      toggleBlock: (saunaId: string, date: string, hour: number, reason = "Uždaryta") => {
        dispatch({ type: "block/toggle", saunaId, date, hour, reason });
        return report(actions.toggleBlock(saunaId, date, hour, reason));
      },
      setInquiryStatus: (id: string, status: InquiryStatus) => {
        dispatch({ type: "inquiry/status", id, status });
        return report(actions.setInquiryStatus(id, status));
      },
      /** Not optimistic: the database re-checks every night; the fresh bookings arrive with the revalidated layout. */
      acceptInquiry: async (id: string) => {
        const result = await report(actions.acceptInquiry(id));
        if ("data" in result) dispatch({ type: "inquiry/accepted", id, acceptedAt: new Date().toISOString() });
        return result;
      },
      releaseInquiry: async (id: string) => {
        const result = await report(actions.releaseInquiry(id));
        if ("data" in result) dispatch({ type: "inquiry/accepted", id });
        return result;
      },
      addInquiryNote: (id: string, text: string) => {
        dispatch({ type: "inquiry/note", id, text });
        return report(actions.addInquiryNote(id, text));
      },
      saveEvent: async (event: ManagedEvent) => {
        const result = await actions.saveEvent(event);
        if ("data" in result) dispatch({ type: "event/upsert", event });
        return result;
      },
      deleteEvent: (id: string) => {
        dispatch({ type: "event/delete", id });
        return report(actions.deleteEvent(id));
      },
      /** Not optimistic: the database refuses more than the free places. */
      setEventHeld: async (id: string, held: number) => {
        const result = await report(actions.setEventHeld(id, held));
        if ("data" in result) dispatch({ type: "event/held", id, held });
        return result;
      },
      setEventPublished: async (id: string, published: boolean) => {
        const result = await report(actions.setEventPublished(id, published));
        if ("data" in result) dispatch({ type: "event/publish", id, published });
        return result;
      },
      updatePrices: (items: PriceItem[]) => {
        dispatch({ type: "prices/update", items });
        return report(actions.updatePrices(items));
      },
      /** Not optimistic: a new sauna's id comes from the server. */
      saveSauna: (id: string | null, values: SaunaValues) => report(actions.saveSauna(id, values)),
      setSaunaActive: (id: string, active: boolean) => {
        dispatch({ type: "sauna/active", id, active });
        return report(actions.setSaunaActive(id, active));
      },
      reorderSaunas: (ids: string[]) => {
        dispatch({ type: "sauna/order", ids });
        return report(actions.reorderSaunas(ids));
      },
      /** Not optimistic: refused while the sauna has bookings. */
      deleteSauna: (id: string) => report(actions.deleteSauna(id)),
      /** Not optimistic: the stored path comes from the server. */
      uploadSaunaPhoto: (saunaId: string, form: FormData) => report(actions.uploadSaunaPhoto(saunaId, form)),
      removeSaunaPhoto: (saunaId: string, path: string, remaining: string[]) => {
        dispatch({ type: "sauna/photos", id: saunaId, paths: remaining });
        return report(actions.removeSaunaPhoto(saunaId, path));
      },
      reorderSaunaPhotos: (saunaId: string, paths: string[]) => {
        dispatch({ type: "sauna/photos", id: saunaId, paths });
        return report(actions.reorderSaunaPhotos(saunaId, paths));
      },
      saveUpsell: (upsell: Upsell) => {
        dispatch({ type: "upsell/upsert", upsell });
        return report(actions.saveUpsell(upsell));
      },
      deleteUpsell: (id: string) => {
        dispatch({ type: "upsell/delete", id });
        return report(actions.deleteUpsell(id));
      },
      saveSaunaMaster: (master: SaunaMaster) => {
        dispatch({ type: "master/upsert", master });
        return report(actions.saveSaunaMaster(master));
      },
      deleteSaunaMaster: (id: string) => {
        dispatch({ type: "master/delete", id });
        return report(actions.deleteSaunaMaster(id));
      },
      saveProgram: (program: SaunaProgram) => {
        dispatch({ type: "program/upsert", program });
        return report(actions.saveProgram(program));
      },
      deleteProgram: (id: string) => {
        dispatch({ type: "program/delete", id });
        return report(actions.deleteProgram(id));
      },
      saveCouponProduct: (product: CouponProduct) => {
        dispatch({ type: "couponProduct/upsert", product });
        return report(actions.saveCouponProduct(product));
      },
      deleteCouponProduct: (id: string) => {
        dispatch({ type: "couponProduct/delete", id });
        return report(actions.deleteCouponProduct(id));
      },
      /** Not optimistic: the id and usage come from the database, and a taken code is refused. */
      saveDiscountCode: (input: DiscountCodeInput) => report(discountActions.saveDiscountCode(input)),
      /** Not optimistic: the list changes only once the database accepted it. */
      setDiscountCodeActive: async (id: string, active: boolean) => {
        const result = await report(discountActions.setDiscountCodeActive(id, active));
        if ("data" in result) dispatch({ type: "discountCode/active", id, active });
        return result;
      },
      /** Not optimistic: refused while live requests hold the code. */
      deleteDiscountCode: async (id: string) => {
        const result = await report(discountActions.deleteDiscountCode(id));
        if ("data" in result) dispatch({ type: "discountCode/delete", id });
        return result;
      },
      /** Not optimistic: the change goes live for every visitor, so the switch only moves once the database has it. */
      setComingSoon: async (enabled: boolean) => {
        const result = await report(siteSettingsActions.setComingSoon(enabled));
        if ("data" in result) dispatch({ type: "siteSettings/comingSoon", enabled });
        return result;
      },
      /** Not optimistic: the change goes live for every visitor. */
      savePageContent: async (slug: string, content: PageContentOverride) => {
        const result = await report(pageContentActions.savePageContent(slug, content));
        if ("data" in result) dispatch({ type: "pageContent/set", slug, content: result.data });
        return result;
      },
      uploadPagePhoto: (slug: string, form: FormData) => report(pageContentActions.uploadPagePhoto(slug, form)),
      /** Opening the bell: the marker moves at once, the write follows (a failure just leaves them "new" after the next refresh). */
      markNotificationsRead: async () => {
        const readAt = new Date().toISOString();
        dispatch({ type: "notifications/read", readAt });
        return notificationActions.markNotificationsRead();
      },
      /** Not optimistic: the id comes from the database and a repeated number is refused. */
      saveNotificationRecipient: (input: NotificationRecipientInput) => report(notificationActions.saveNotificationRecipient(input)),
      setNotificationRecipientActive: async (id: string, active: boolean) => {
        const result = await report(notificationActions.setNotificationRecipientActive(id, active));
        if ("data" in result) dispatch({ type: "notificationRecipient/active", id, active });
        return result;
      },
      deleteNotificationRecipient: async (id: string) => {
        const result = await report(notificationActions.deleteNotificationRecipient(id));
        if ("data" in result) dispatch({ type: "notificationRecipient/delete", id });
        return result;
      },
      /** Not optimistic: the code and expiry come from the database. */
      activateCoupon: (id: string) => report(actions.activateCoupon(id)),
      resendCouponEmail: (id: string) => report(actions.resendCouponEmail(id)),
      /** Not optimistic: the database checks balance, status and expiry. */
      redeemCoupon: (id: string, amount: number, note: string) => report(actions.redeemCoupon(id, amount, note)),
      cancelCoupon: (id: string) => {
        dispatch({ type: "coupon/cancel", id });
        return report(actions.cancelCoupon(id));
      },
      /** Not optimistic: Stripe decides. Returns the euros refunded. */
      refundCoupon: async (id: string) => {
        const result = await report(actions.refundCoupon(id));
        if ("data" in result) dispatch({ type: "coupon/refunded", id, amount: result.data.refunded });
        return result;
      },
      /** The signed rules of a customer as a PDF (base64). */
      riderWaiverPdf: (riderId: string) => report(actions.riderWaiverPdf(riderId)),
      /** The coupon as a PDF (base64), for the download button. */
      couponPdf: (id: string) => report(actions.couponPdf(id)),
      /** Not optimistic: the reference and price come from the database. */
      createRental: async (input: StaffRentalInput) => {
        const result = await actions.createRental(input);
        if ("data" in result) dispatch({ type: "rental/add", rental: result.data });
        return result;
      },
      /** Not optimistic: the database re-checks capacity when a cancelled rental is reopened. */
      setRentalStatus: async (id: string, status: BookingStatus) => {
        const result = await report(actions.setRentalStatus(id, status));
        if ("data" in result) dispatch({ type: "rental/status", id, status });
        return result;
      },
      setTourTicketStatus: (id: string, status: BookingStatus) => report(actions.setTourTicketStatus(id, status)),
      /** Cancels a request and, with `refund`, refunds what it paid. Not optimistic: Stripe answers first. */
      cancelRequest: async (kind: "booking" | "rental" | "ticket", id: string, refund: boolean) => {
        const result = await report(actions.cancelRequest(kind, id, refund));
        if ("data" in result) {
          if (kind === "booking") dispatch({ type: "booking/status", id, status: "atsaukta" });
          if (kind === "rental") dispatch({ type: "rental/status", id, status: "atsaukta" });
          if (kind === "ticket") dispatch({ type: "ticket/status", id, status: "atsaukta" });
          if (result.data.refundError) toast.error(`Atšaukta, bet pinigų grąžinti nepavyko. ${result.data.refundError}`);
          else if (result.data.refunded > 0) toast.success(`Atšaukta. Klientui grąžinama ${formatEuro(result.data.refunded)} (Stripe).`);
        }
        return result;
      },
      /** Removes a cancelled request (refunded, or never paid online). Not optimistic: the server checks the refund first. */
      deleteRequest: async (kind: "booking" | "rental" | "ticket", id: string) => {
        const result = await report(actions.deleteRequest(kind, id));
        if ("data" in result) dispatch({ type: "request/delete", kind, id });
        return result;
      },
      saveStayType: (stayType: StayType) => {
        dispatch({ type: "stayType/upsert", stayType });
        return report(actions.saveStayType(stayType));
      },
      deleteStayType: (id: string) => {
        dispatch({ type: "stayType/delete", id });
        return report(actions.deleteStayType(id));
      },
      saveQuadType: (quadType: QuadType) => {
        dispatch({ type: "quadType/upsert", quadType });
        return report(actions.saveQuadType(quadType));
      },
      deleteQuadType: (id: string) => {
        dispatch({ type: "quadType/delete", id });
        return report(actions.deleteQuadType(id));
      },
      saveQuadTourRoute: (route: QuadTourRoute) => {
        dispatch({ type: "quadTourRoute/upsert", route });
        return report(actions.saveQuadTourRoute(route));
      },
      deleteQuadTourRoute: (id: string) => {
        dispatch({ type: "quadTourRoute/delete", id });
        return report(actions.deleteQuadTourRoute(id));
      },
      saveQuadTourAccessory: (accessory: QuadTourAccessory) => {
        dispatch({ type: "quadTourAccessory/upsert", accessory });
        return report(actions.saveQuadTourAccessory(accessory));
      },
      deleteQuadTourAccessory: (id: string) => {
        dispatch({ type: "quadTourAccessory/delete", id });
        return report(actions.deleteQuadTourAccessory(id));
      },
      updateQuadSettings: (settings: QuadSettings) => {
        dispatch({ type: "quadSettings", settings });
        return report(actions.updateQuadSettings(settings));
      },
      changeOwnPassword: (password: string) => report(actions.changeOwnPassword(password)),
      /** Not optimistic: the login and its temporary password come from the server. */
      createStaff: async (input: { email: string; displayName: string; roleId: string }) => {
        const result = await report(staffActions.createStaff(input));
        if ("data" in result) {
          dispatch({
            type: "staff/add",
            member: { userId: result.data.userId, name: input.displayName, email: input.email.toLowerCase(), roleId: input.roleId, active: true, createdAt: new Date().toISOString() },
          });
        }
        return result;
      },
      resetStaffPassword: (userId: string) => report(staffActions.resetStaffPassword(userId)),
      setStaffRole: (userId: string, roleId: string) => {
        dispatch({ type: "staff/role", userId, roleId });
        return report(staffActions.setStaffRole(userId, roleId));
      },
      setStaffActive: (userId: string, active: boolean) => {
        dispatch({ type: "staff/active", userId, active });
        return report(staffActions.setStaffActive(userId, active));
      },
      removeStaff: (userId: string) => {
        dispatch({ type: "staff/remove", userId });
        return report(staffActions.removeStaff(userId));
      },
      saveRole: (role: StaffRole) => {
        dispatch({ type: "role/upsert", role });
        return report(staffActions.saveRole({ id: role.id, name: role.name, description: role.description, permissions: role.permissions as PermissionId[] }));
      },
      deleteRole: (id: string) => {
        dispatch({ type: "role/delete", id });
        return report(staffActions.deleteRole(id));
      },
      /** Not optimistic: a new plan's id comes from the server. */
      saveRidePlan: async (plan: RidePlan) => {
        const result = await report(actions.saveRidePlan(plan));
        if ("data" in result) dispatch({ type: "ridePlan/upsert", plan: result.data });
        return result;
      },
      /** Not optimistic: refused while a rider is still on this plan. */
      deleteRidePlan: async (id: string) => {
        const result = await report(actions.deleteRidePlan(id));
        if ("data" in result) dispatch({ type: "ridePlan/delete", id });
        return result;
      },
      /** Not optimistic: the id comes from the server; also logs the sale. */
      createRider: async (input: { name: string; surname: string; planId: string }) => {
        const result = await actions.createRider(input);
        if ("data" in result) {
          dispatch({ type: "rider/add", rider: result.data.rider });
          if (result.data.purchase) dispatch({ type: "purchase/add", purchase: result.data.purchase });
        }
        return result;
      },
      /** Optimistic plan change; the sale it logs arrives once the server confirms. */
      updateRiderPlan: async (id: string, planId: string) => {
        dispatch({ type: "rider/plan", id, planId });
        const result = await report(actions.updateRiderPlan(id, planId));
        if ("data" in result && result.data.purchase) dispatch({ type: "purchase/add", purchase: result.data.purchase });
        return result;
      },
      updateRiderProfile: async (id: string, input: RiderProfileInput) => {
        const result = await report(actions.updateRiderProfile(id, input));
        if ("data" in result) dispatch({ type: "rider/profile", rider: result.data });
        return result;
      },
      uploadRiderAvatar: async (id: string, form: FormData) => {
        const result = await report(actions.uploadRiderAvatar(id, form));
        if ("data" in result) dispatch({ type: "rider/avatar", id, avatarPath: result.data.avatarPath });
        return result;
      },
      removeRiderAvatar: async (id: string) => {
        const result = await report(actions.removeRiderAvatar(id));
        if ("data" in result) dispatch({ type: "rider/avatar", id, avatarPath: null });
        return result;
      },
      getRiderFileUrl: (bucket: "rider-photos" | "rider-documents" | "rider-waivers", path: string) => actions.getRiderFileUrl(bucket, path),
      addRiderComment: async (riderId: string, text: string) => {
        const result = await report(actions.addRiderComment(riderId, text));
        if ("data" in result) dispatch({ type: "riderComment/add", comment: result.data });
        return result;
      },
      deleteRiderComment: (id: string) => {
        dispatch({ type: "riderComment/delete", id });
        return report(actions.deleteRiderComment(id));
      },
      addRiderDocument: async (riderId: string, form: FormData) => {
        const result = await report(actions.addRiderDocument(riderId, form));
        if ("data" in result) dispatch({ type: "riderDocument/add", document: result.data });
        return result;
      },
      deleteRiderDocument: (id: string) => {
        dispatch({ type: "riderDocument/delete", id });
        return report(actions.deleteRiderDocument(id));
      },
      /** Not optimistic: the rows leave the list once the server has removed them. */
      deleteRiders: async (ids: string[]) => {
        const result = await report(actions.deleteRiders(ids));
        if ("data" in result) for (const id of result.data.removed) dispatch({ type: "rider/delete", id });
        return result;
      },
      deleteRider: (id: string) => {
        dispatch({ type: "rider/delete", id });
        return report(actions.deleteRider(id));
      },
      /** Not optimistic: whether a bracelet was moved from someone else comes from the server. */
      bindRiderCard: async (cardNumber: string, riderId: string) => {
        const result = await report(actions.bindRiderCard(cardNumber, riderId));
        if ("data" in result) dispatch({ type: "riderCard/bind", cardNumber, riderId });
        return result;
      },
      /**
       * Not optimistic: whether this scan checks a rider in or out comes from
       * the server. An unassigned bracelet is a routine result the screen
       * shows inline, not an error toast — only an unexpected failure gets one.
       */
      scanRiderSession: async (cardNumber: string) => {
        const result = await actions.scanRiderSession(cardNumber);
        if ("data" in result) dispatch({ type: "riderSession/scan", session: result.data.session });
        else if (result.error.code !== "not_found") toast.error(result.error.message);
        return result;
      },
    }),
    [],
  );
  return { ...state, ...api };
}

type AdminStore = ReturnType<typeof useAdminReducer>;

const AdminContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ initial, children }: { initial: AdminData; children: React.ReactNode }) {
  const store = useAdminReducer(initial);
  return <AdminContext.Provider value={store}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminStore {
  const store = useContext(AdminContext);
  if (!store) throw new Error("useAdmin must be used inside <AdminStoreProvider>");
  return store;
}
