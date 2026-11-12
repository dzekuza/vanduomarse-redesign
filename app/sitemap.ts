import type { MetadataRoute } from "next";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { SERVICE_PAGES } from "@/components/services/service-content";
import { SITE_URL } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

/** Public pages only; /admin, /paskyra, /embed and the payment return page stay out (see robots.ts). */
const PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/rezervacija", priority: 0.9 },
  { path: "/renginiai", priority: 0.8 },
  { path: "/kuponai", priority: 0.7 },
  { path: "/kontaktai", priority: 0.5 },
  { path: "/privatumo-politika", priority: 0.3 },
  ...Object.keys(SERVICE_PAGES).map((slug) => ({ path: `/${slug}`, priority: 0.8 })),
];

/** When the owner last edited each service page (`page_content.updated_at`), by slug. Empty when the read fails. */
async function pageEditDates(): Promise<Map<string, Date>> {
  try {
    const { data } = await createPublicClient().from("page_content").select("slug, updated_at");
    return new Map((data ?? []).map((row) => [row.slug, new Date(row.updated_at)]));
  } catch {
    return new Map();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const edited = await pageEditDates();
  return PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    // Only a real date: pages edited in /admin/puslapiai. Others carry none rather than an invented one.
    lastModified: edited.get(path.slice(1)),
    priority,
    images: path === "/vandenlentes" ? SERVICE_GALLERY.wake.map(({ src }) => `${SITE_URL}${src}`) : undefined,
  }));
}
