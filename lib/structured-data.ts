import type { ParkEventData } from "@/lib/park-events";
import { PARK_ADDRESS } from "@/components/landing/content";
import { INSTAGRAM_URL, MAIN_CONTACT, MAPS_URL, PARK_LOCATION } from "@/lib/contacts";
import { BRAND } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const BUSINESS_ID = `${SITE_URL}/#business`;

/** Opening hours from the park's Google Business Profile (the "Vanduo Marse" set; the restaurant's breakfast set is not listed). */
const OPENING_HOURS = [
  { dayOfWeek: ["Friday"], opens: "17:00", closes: "21:00" },
  { dayOfWeek: ["Saturday", "Sunday"], opens: "10:00", closes: "20:00" },
].map((hours) => ({ "@type": "OpeningHoursSpecification", ...hours }));

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
      postalCode: "54311",
      addressCountry: "LT",
    },
    geo: { "@type": "GeoCoordinates", latitude: PARK_LOCATION.latitude, longitude: PARK_LOCATION.longitude },
    openingHoursSpecification: OPENING_HOURS,
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

/** Question and answer pairs already published on the page (FAQPage markup must match visible content). */
export function faqSchema(items: readonly { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Home > page trail for a page one level below the home page. */
export function breadcrumbSchema({ name, path }: { name: string; path: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND, item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}

/** The contact page, about the park business declared on the home page. */
export function contactPageSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Kontaktai ir kaip atvykti",
    url: `${SITE_URL}/kontaktai`,
    about: { "@id": BUSINESS_ID },
  };
}

/** The upcoming events listed on /renginiai (the same ones the visitor sees there), as schema.org Event items. Dates are Vilnius local time. */
export function eventsSchema(events: readonly ParkEventData[]): Record<string, unknown> | null {
  if (events.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@graph": events.map((e) => ({
      "@type": "Event",
      name: e.title,
      description: e.blurb,
      startDate: e.time ? `${e.date}T${e.time}:00` : e.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: e.place || BRAND,
        address: { "@type": "PostalAddress", streetAddress: PARK_ADDRESS.street, addressLocality: "Žemaitkiemis", addressCountry: "LT" },
      },
      organizer: { "@id": BUSINESS_ID },
      url: `${SITE_URL}/renginiai`,
      offers: {
        "@type": "Offer",
        price: e.price ?? 0,
        priceCurrency: "EUR",
        url: `${SITE_URL}/renginiai`,
        availability: e.spotsLeft === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      },
    })),
  };
}
