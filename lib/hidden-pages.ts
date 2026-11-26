/**
 * Public links to service pages the owner switched off (/admin/puslapiai, ADR-0137) are left out. These helpers
 * work on hrefs, so header, menu, tiles and footer can share them; they never touch the database themselves.
 */

/** The first path segment of an internal href (`/pirtis#rezervuoti` → `pirtis`); null for `/`, anchors and outside links. */
export function hrefSlug(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const slug = href.slice(1).split(/[/?#]/)[0];
  return slug || null;
}

/** Whether `href` points at a hidden service page. */
export function isHiddenHref(href: string, hidden: readonly string[]): boolean {
  const slug = hrefSlug(href);
  return slug !== null && hidden.includes(slug);
}

interface LinkLike {
  href: string;
  children?: readonly { href: string; label: string }[];
}

/** Drops links (and dropdown children) that point at hidden pages. A parent keeps its place even if all its children go. */
export function withoutHiddenLinks<T extends LinkLike>(links: readonly T[], hidden: readonly string[]): T[] {
  if (hidden.length === 0) return [...links];
  return links
    .filter((link) => !isHiddenHref(link.href, hidden))
    .map((link) => (link.children ? { ...link, children: link.children.filter((child) => !isHiddenHref(child.href, hidden)) } : link));
}
