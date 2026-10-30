/**
 * Booking widgets for third-party sites (the WordPress plugin in `wordpress/`).
 * `/embed/*` renders one booking flow with no site chrome, inside an iframe.
 * Pure helpers: safe to import from client and server code.
 */

/** postMessage type the embed sends to its parent page with the content height. */
export const EMBED_HEIGHT_MESSAGE = "vm-embed:height";

/** Public booking routes that have an embed twin, so links inside a widget stay in the widget. */
const EMBEDDABLE = ["/pirtis", "/keturraciai", "/miegas", "/renginiai", "/kuponai"] as const;

export type EmbedWidget = "pirtis" | "keturraciai" | "miegas" | "renginiai" | "kuponai";

/** `/pirtis` → `/embed/pirtis`; `null` for routes with no embed. */
export function toEmbedPath(pathname: string): string | null {
  return EMBEDDABLE.find((p) => p === pathname) ? `/embed${pathname}` : null;
}

/**
 * CSP `frame-ancestors` value from a comma-separated origin list
 * (`EMBED_ALLOWED_ORIGINS`). Anything that is not a bare http(s) origin is
 * dropped, so a typo can only narrow who may frame the widget, never widen it.
 */
export function frameAncestors(list: string | undefined): string {
  const origins = (list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      try {
        const url = new URL(s);
        return (url.protocol === "https:" || url.protocol === "http:") && url.origin === s;
      } catch {
        return false;
      }
    });
  return ["'self'", ...origins].join(" ");
}
