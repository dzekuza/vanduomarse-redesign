import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { Session } from "@supabase/supabase-js";
import type { StaffAccess } from "@/lib/admin/permissions";
import type {
  AdminData,
  BookingStatus,
  InquiryStatus,
} from "@/lib/admin/types";
import {
  acceptInquiryMobile,
  activateCouponMobile,
  addInquiryNoteMobile,
  addRiderCommentMobile,
  bindRiderCardMobile,
  cancelCouponMobile,
  cancelRequestMobile,
  createBookingMobile,
  createRiderMobile,
  fetchCurrentStaff,
  fetchMobileAdminData,
  redeemCouponMobile,
  releaseInquiryMobile,
  scanRiderSessionMobile,
  setBookingStatusMobile,
  setInquiryStatusMobile,
  setRentalStatusMobile,
  setTourTicketStatusMobile,
  toggleBlockMobile,
  updateRiderPlanMobile,
  type NewBookingMobileInput,
} from "@/mobile/src/lib/admin-api";
import { supabase } from "@/mobile/src/lib/supabase";

export type AuthState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "no_access"; email: string; reason: "not_staff" | "inactive" | "no_pages" }
  | { status: "ready"; access: StaffAccess; data: AdminData };

export interface MobileAdminContextValue {
  auth: AuthState;
  refreshing: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  setRentalStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  setTourTicketStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  cancelRequest: (kind: "booking" | "rental" | "ticket", id: string, refund: boolean) => Promise<boolean>;
  createBooking: (input: NewBookingMobileInput) => Promise<boolean>;
  toggleBlock: (saunaId: string, date: string, hour: number, reason?: string) => Promise<boolean>;
  setInquiryStatus: (id: string, status: InquiryStatus) => Promise<boolean>;
  addInquiryNote: (id: string, text: string) => Promise<boolean>;
  acceptInquiry: (id: string) => Promise<boolean>;
  releaseInquiry: (id: string) => Promise<boolean>;
  activateCoupon: (id: string) => Promise<{ code: string; expiresAt: string; emailSent: boolean } | null>;
  redeemCoupon: (id: string, amount: number, note: string) => Promise<boolean>;
  cancelCoupon: (id: string) => Promise<boolean>;
  scanRiderSession: typeof scanRiderSessionMobile;
  bindRiderCard: (cardNumber: string, riderId: string) => Promise<{ replacedName: string | null } | null>;
  createRider: (input: { name: string; surname: string; planId: string }) => Promise<string | null>;
  updateRiderPlan: (riderId: string, planId: string) => Promise<boolean>;
  addRiderComment: (riderId: string, text: string) => Promise<boolean>;
}

const MobileAdminContext = createContext<MobileAdminContextValue | null>(null);

export function MobileAdminProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const loadForSession = useCallback(async (session: Session | null, silent = false) => {
    if (!session) {
      setAuth({ status: "signed_out" });
      return;
    }
    if (!silent) setRefreshing(true);
    try {
      const { user, staff, access } = await fetchCurrentStaff();
      if (!user) {
        setAuth({ status: "signed_out" });
        return;
      }
      const email = user.email ?? "";
      if (!staff || !access) {
        setAuth({ status: "no_access", email, reason: "not_staff" });
        return;
      }
      if (!staff.active) {
        setAuth({ status: "no_access", email, reason: "inactive" });
        return;
      }
      if (!access.isOwner && access.permissions.length === 0) {
        setAuth({ status: "no_access", email, reason: "no_pages" });
        return;
      }
      const data = await fetchMobileAdminData(access);
      setAuth({ status: "ready", access, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nepavyko užkrauti duomenų.";
      // The message alone ("undefined is not a function") does not say where: keep the stack in the Metro log, and show it in dev.
      console.error("Admin data load failed:", err);
      Alert.alert("Klaida", __DEV__ && err instanceof Error && err.stack ? `${msg}\n\n${err.stack.split("\n").slice(0, 6).join("\n")}` : msg);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      loadForSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForSession(session, true);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadForSession]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadForSession(data.session, false);
  }, [loadForSession]);

  const updateData = useCallback((updater: (prev: AdminData) => AdminData) => {
    setAuth((prev) => (prev.status === "ready" ? { ...prev, data: updater(prev.data) } : prev));
  }, []);

  const value = useMemo<MobileAdminContextValue>(() => {
    const userId = auth.status === "ready" ? auth.access.userId : "";
    const staffName = auth.status === "ready" ? auth.access.name : "Darbuotojas";

    return {
      auth,
      refreshing,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
        setAuth({ status: "signed_out" });
      },
      setBookingStatus: async (id, status) => {
        updateData((d) => ({
          ...d,
          bookings: d.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        }));
        const res = await setBookingStatusMobile(id, status);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      setRentalStatus: async (id, status) => {
        updateData((d) => ({
          ...d,
          quadRentals: d.quadRentals.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        const res = await setRentalStatusMobile(id, status);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      setTourTicketStatus: async (id, status) => {
        updateData((d) => ({
          ...d,
          tourTickets: d.tourTickets.map((t) => (t.id === id ? { ...t, status } : t)),
          eventTickets: d.eventTickets.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
        const res = await setTourTicketStatusMobile(id, status);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      cancelRequest: async (kind, id, refund) => {
        const res = await cancelRequestMobile(kind, id, refund);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        if (res.data.refundError) {
          Alert.alert("Atšaukta (grąžinimo klaida)", res.data.refundError);
        }
        await refresh();
        return true;
      },
      createBooking: async (input) => {
        const res = await createBookingMobile(input);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        updateData((d) => ({ ...d, bookings: [...d.bookings, res.data] }));
        return true;
      },
      toggleBlock: async (saunaId, date, hour, reason = "Uždaryta") => {
        updateData((d) => {
          const same = (b: { saunaId: string; date: string; hour: number }) =>
            b.saunaId === saunaId && b.date === date && b.hour === hour;
          return {
            ...d,
            blocks: d.blocks.some(same)
              ? d.blocks.filter((b) => !same(b))
              : [...d.blocks, { id: `pending-${saunaId}-${date}-${hour}`, saunaId, date, hour, reason }],
          };
        });
        const res = await toggleBlockMobile(saunaId, date, hour, userId, reason);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      setInquiryStatus: async (id, status) => {
        updateData((d) => ({
          ...d,
          inquiries: d.inquiries.map((q) => (q.id === id ? { ...q, status } : q)),
        }));
        const res = await setInquiryStatusMobile(id, status);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      addInquiryNote: async (id, text) => {
        const now = new Date().toISOString();
        updateData((d) => ({
          ...d,
          inquiries: d.inquiries.map((q) =>
            q.id === id ? { ...q, notes: [...q.notes, { at: now, text: text.trim() }] } : q,
          ),
        }));
        const res = await addInquiryNoteMobile(id, text, userId);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      acceptInquiry: async (id) => {
        const res = await acceptInquiryMobile(id);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        await refresh();
        return true;
      },
      releaseInquiry: async (id) => {
        const res = await releaseInquiryMobile(id);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        await refresh();
        return true;
      },
      activateCoupon: async (id) => {
        const res = await activateCouponMobile(id);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return null;
        }
        await refresh();
        return res.data;
      },
      redeemCoupon: async (id, amount, note) => {
        const res = await redeemCouponMobile(id, amount, note, userId);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        await refresh();
        return true;
      },
      cancelCoupon: async (id) => {
        updateData((d) => ({
          ...d,
          coupons: d.coupons.map((c) => (c.id === id ? { ...c, status: "atsauktas" } : c)),
        }));
        const res = await cancelCouponMobile(id);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        return true;
      },
      scanRiderSession: async (cardNumber) => {
        const res = await scanRiderSessionMobile(cardNumber);
        if ("data" in res) {
          updateData((d) => ({
            ...d,
            riderSessions: [
              res.data.session,
              ...d.riderSessions.filter((s) => s.id !== res.data.session.id),
            ],
            riders: d.riders.some((r) => r.id === res.data.rider.id)
              ? d.riders
              : [res.data.rider, ...d.riders],
          }));
        }
        return res;
      },
      bindRiderCard: async (cardNumber, riderId) => {
        const res = await bindRiderCardMobile(cardNumber, riderId);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return null;
        }
        updateData((d) => ({
          ...d,
          riderCards: [
            ...d.riderCards.filter((c) => c.cardNumber !== cardNumber && c.riderId !== riderId),
            { cardNumber, riderId, boundAt: new Date().toISOString() },
          ],
        }));
        return {
          replacedName: res.data.replaced
            ? `${res.data.replaced.name} ${res.data.replaced.surname}`
            : null,
        };
      },
      createRider: async (input) => {
        const res = await createRiderMobile(input, userId);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return null;
        }
        updateData((d) => ({
          ...d,
          riders: [res.data.rider, ...d.riders],
          purchases: res.data.purchase ? [res.data.purchase, ...d.purchases] : d.purchases,
        }));
        return res.data.rider.id;
      },
      updateRiderPlan: async (riderId, planId) => {
        updateData((d) => ({
          ...d,
          riders: d.riders.map((r) => (r.id === riderId ? { ...r, planId } : r)),
        }));
        const res = await updateRiderPlanMobile(riderId, planId, userId);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          await refresh();
          return false;
        }
        if (res.data.purchase) {
          updateData((d) => ({
            ...d,
            purchases: [res.data.purchase!, ...d.purchases],
          }));
        }
        return true;
      },
      addRiderComment: async (riderId, text) => {
        const res = await addRiderCommentMobile(riderId, text, userId, staffName);
        if ("error" in res) {
          Alert.alert("Klaida", res.error.message);
          return false;
        }
        updateData((d) => ({
          ...d,
          riderComments: [res.data, ...d.riderComments],
        }));
        return true;
      },
    };
  }, [auth, refreshing, refresh, updateData]);

  return <MobileAdminContext.Provider value={value}>{children}</MobileAdminContext.Provider>;
}

export function useMobileAdmin(): MobileAdminContextValue {
  const ctx = useContext(MobileAdminContext);
  if (!ctx) throw new Error("useMobileAdmin must be used inside <MobileAdminProvider>");
  return ctx;
}

export function useReadyAdmin() {
  const ctx = useMobileAdmin();
  if (ctx.auth.status !== "ready") {
    throw new Error("useReadyAdmin must be called when auth.status === 'ready'");
  }
  return {
    ...ctx,
    access: ctx.auth.access,
    data: ctx.auth.data,
  };
}
