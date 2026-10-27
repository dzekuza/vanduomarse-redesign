import "server-only";
import { redirect } from "next/navigation";
import { firstAllowedHref, hasPermission, type PermissionId } from "@/lib/admin/permissions";
import { currentStaff } from "@/lib/admin/repository";
import { createClient } from "@/lib/supabase/server";

/**
 * Page-level check for admin routes: sends someone without the permission to the
 * first page their role does allow. The database enforces the same rule on every
 * read and write, so this is about not showing pages that would only be empty.
 * `"owner"` is for staff management.
 *
 * A role with no pages at all is not redirected: the panel layout already shows
 * its "no access" screen, and redirecting here would loop.
 */
export async function requirePermission(permission: PermissionId | "owner"): Promise<void> {
  const supabase = await createClient();
  const { user, staff, access } = await currentStaff(supabase);
  if (!user) redirect("/admin/prisijungti");
  if (!staff || !staff.active || !access) return;

  const allowed = permission === "owner" ? access.isOwner : hasPermission(access, permission);
  if (allowed) return;

  const target = firstAllowedHref(access);
  if (target) redirect(target);
}
