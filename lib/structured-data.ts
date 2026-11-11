import { PARK_ADDRESS } from "@/components/landing/content";
import { INSTAGRAM_URL, MAIN_CONTACT, MAPS_URL } from "@/lib/contacts";
import { BRAND } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const BUSINESS_ID = `${SITE_URL}/#business`;

/** The park as a local business: name, address and contacts only, nothing that is not published on the site. */
export function localBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": BUSINESS_ID,
    name: BRAND,
    url: SITE_URL,
    image: `${SITE_URL}/landing/wake.webp`,
    telephone: MAIN_CONTACT.phone,
    email: MAIN_CONTACT.email,
    description: "Kabelinis vandenlenčių parkas su pirtimi, keturračiais, nameliais ir šventėms skirtomis erdvėmis Kauno rajone.",
    address: {
      "@type": "PostalAddress",
      streetAddress: PARK_ADDRESS.street,
      addressLocality: "Žemaitkiemis",
      addressRegion: "Kauno rajonas",
      postalCode: "54312",
      addressCountry: "LT",
    },
    hasMap: MAPS_URL,
    sameAs: [INSTAGRAM_URL],
  };
}

/** One service page (sauna, quads, cabins, ...) offered by the park. */
export function serviceSchema({ name, description, path }: { name: string; description: string; path: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { "@id": BUSINESS_ID },
    areaServed: "Kauno rajonas",
  };
}
