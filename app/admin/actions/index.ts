/**
 * Staff server actions, grouped by domain. Each file is its own "use server"
 * module; this barrel keeps `@/app/admin/actions` as the single import path
 * (it is not itself a "use server" file, so it may re-export).
 */
export { signIn, sendStaffCode, confirmStaffCode, signOut, changeOwnPassword } from "./auth";
export * from "./bookings";
export * from "./events";
export * from "./sauna";
export * from "./coupons";
export * from "./stays";
export * from "./quads";
export * from "./riders";
export type { ActionResult } from "@/lib/admin/action-helpers";
