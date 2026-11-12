import type { MetadataRoute } from "next";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { SERVICE_PAGES } from "@/components/services/service-content";
import { SITE_URL } from "@/lib/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
    images: path === "/vandenlentes" ? SERVICE_GALLERY.wake.map(({ src }) => `${SITE_URL}${src}`) : undefined,
  }));
}
