/** Admin colour scheme, kept in a cookie so the server renders the right one. */
export type AdminTheme = "light" | "dark";

export const ADMIN_THEME_COOKIE = "admin-theme";

export function parseAdminTheme(value: string | undefined): AdminTheme {
  return value === "dark" ? "dark" : "light";
}
