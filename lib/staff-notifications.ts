import "server-only";
import type { NotifyService } from "@/lib/contacts";
import type { PermissionId } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The feed behind the admin notification bell (ADR-0088): one row per event staff are told about, written next to the
 * SMS / e-mail / push of the same event by `lib/notify.ts`. Never throws: a missing migration or a database hiccup must not
 * fail a booking or a payment.
 */

export type StaffNotificationKind = "uzklausa" | "mokejimas" | "mokejimas_patikrinti" | "dvigubas" | "atsaukta";

export interface StaffNotificationInput {
  kind: StaffNotificationKind;
  /** Staff whose role has any of these admin page permissions see it (owners see everything). */
  permissions: PermissionId[];
  title: string;
  body?: string;
  reference?: string;
  /** An admin path; defaults to the overview. */
  href?: string;
}

/** Feed rows older than this are dropped whenever a new one is written. */
const KEEP_DAYS = 60;

export async function recordStaffNotification(n: StaffNotificationInput): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("staff_notifications").insert({
      kind: n.kind,
      permissions: n.permissions.length ? [...new Set(n.permissions)] : ["rezervacijos"],
      title: n.title.slice(0, 200),
      body: (n.body ?? "").slice(0, 1000),
      reference: n.reference ?? null,
      href: n.href ?? "/admin",
    });
    if (error) {
      console.error("staff_notifications insert failed:", error.message);
      return false;
    }
    await admin.from("staff_notifications").delete().lt("created_at", new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString());
    return true;
  } catch {
    console.error("staff_notifications insert failed (no service key?)");
    return false;
  }
}

/** The admin pages whose staff handle a service (who sees its notifications). Event enquiries and tickets belong to `kita`. */
const PERMISSION_OF_SERVICE: Record<NotifyService, PermissionId[]> = {
  pirtis: ["rezervacijos"],
  nakvyne: ["rezervacijos"],
  keturraciai: ["keturraciai"],
  kita: ["uzklausos", "renginiai"],
};

const HREF_OF_SERVICE: Record<NotifyService, string> = {
  pirtis: "/admin/rezervacijos",
  nakvyne: "/admin/rezervacijos",
  keturraciai: "/admin/keturraciai",
  kita: "/admin/uzklausos",
};

export const permissionsOfServices = (services: NotifyService[]): PermissionId[] => [...new Set(services.flatMap((s) => PERMISSION_OF_SERVICE[s]))];

/** Where a notification about these services leads: the page of the first one (payments may span several). */
export const hrefOfServices = (services: NotifyService[]): string => HREF_OF_SERVICE[services[0] ?? "kita"];
