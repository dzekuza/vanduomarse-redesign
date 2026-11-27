import "server-only";
import { cache } from "react";
import type { ServicePhoto } from "@/components/landing/content";
import { SERVICE_PAGES, type ServicePageCopy, type ServiceSlug } from "@/components/services/service-content";
import { mergeServiceCopy, pageContentSchema, type PageContentOverride } from "@/lib/page-content";
import { createPublicClient } from "@/lib/supabase/public";

interface PageRows {
  overrides: Map<string, PageContentOverride>;
  hidden: Set<string>;
}

/**
 * Every saved override by slug, and the pages the owner switched off. A failed read or an invalid row falls back to the
 * code defaults (and nothing hidden), so a page never breaks on bad content.
 */
const readPageRows = cache(async (): Promise<PageRows> => {
  const { data, error } = await createPublicClient().from("page_content").select("slug, content, hidden");
  if (error) {
    console.error("Page content", error.message);
    return { overrides: new Map(), hidden: new Set() };
  }
  const overrides = new Map<string, PageContentOverride>();
  for (const row of data) {
    const parsed = pageContentSchema.safeParse(row.content);
    if (parsed.success) overrides.set(row.slug, parsed.data);
  }
  return { overrides, hidden: new Set(data.filter((row) => row.hidden).map((row) => row.slug)) };
});

/** Service pages the owner switched off in /admin/puslapiai: they 404 and every public link to them is left out. */
export async function getHiddenServiceSlugs(): Promise<string[]> {
  return [...(await readPageRows()).hidden];
}

/** Local development only: SHOW_HIDDEN_PAGES=1 opens switched-off pages so they can be worked on; production ignores it. */
const SHOW_HIDDEN_LOCALLY = process.env.NODE_ENV === "development" && process.env.SHOW_HIDDEN_PAGES === "1";

export async function isServicePageHidden(slug: ServiceSlug): Promise<boolean> {
  if (SHOW_HIDDEN_LOCALLY) return false;
  return (await readPageRows()).hidden.has(slug);
}

/** A service page's text with the owner's edits applied, and the owner's photos when they replaced the defaults. */
export async function getServicePageContent(slug: ServiceSlug): Promise<{ copy: ServicePageCopy; photos: ServicePhoto[] | undefined }> {
  const override = (await readPageRows()).overrides.get(slug);
  const base: ServicePageCopy = SERVICE_PAGES[slug];
  return { copy: mergeServiceCopy(base, override), photos: override?.photos?.length ? override.photos : undefined };
}
