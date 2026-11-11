import type { Metadata } from "next";

export const BRAND = "Vanduo Marse";

/** Share image used when a page has none of its own. */
export const DEFAULT_OG_IMAGE = {
  url: "/landing/wake.webp",
  alt: "Vanduo Marse kabelinis vandenlenčių parkas prie ežero",
};

interface PageSeo {
  title: string;
  description: string;
  /** Path of the page, e.g. "/kuponai"; becomes the canonical and og:url. */
  path: string;
  image?: { url: string; alt: string };
  /** Use the title as written, without the " | Vanduo Marse" suffix. */
  absoluteTitle?: boolean;
}

/** Title, description, canonical, Open Graph and Twitter tags for one public page. */
export function pageMetadata({ title, description, path, image = DEFAULT_OG_IMAGE, absoluteTitle = false }: PageSeo): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${BRAND}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "lt_LT", siteName: BRAND, title: fullTitle, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image.url] },
  };
}

/** Joins sentences into one meta description and cuts it at a word boundary under `max` characters. */
export function metaDescription(parts: string[], max = 158): string {
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}
