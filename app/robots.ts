import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/paskyra", "/embed", "/api", "/rezervacija/mokejimas"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
