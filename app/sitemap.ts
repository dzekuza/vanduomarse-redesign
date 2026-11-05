import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages only; /admin, /paskyra, /embed and the payment return page stay out (see robots.ts). */
const PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/rezervacija", priority: 0.9 },
  { path: "/renginiai", priority: 0.8 },
  { path: "/keturraciai", priority: 0.7 },
  { path: "/kuponai", priority: 0.7 },
  { path: "/skaiciuokle", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority }));
}
