import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { ServicePhoto } from "@/components/landing/content";
import { SERVICE_PAGES, type ServicePageCopy, type ServiceSlug } from "@/components/services/service-content";
import { mergeServiceCopy, pageContentSchema, type PageContentOverride } from "@/lib/page-content";
import { createPublicClient } from "@/lib/supabase/public";

/** Every saved override by slug. A failed read or an invalid row falls back to the code defaults, so a page never breaks on bad content. */
const readOverrides = cache(async (): Promise<Map<string, PageContentOverride>> => {
  await connection();
  const { data, error } = await createPublicClient().from("page_content").select("slug, content");
  if (error) {
    console.error("Page content", error.message);
    return new Map();
  }
  const out = new Map<string, PageContentOverride>();
  for (const row of data) {
    const parsed = pageContentSchema.safeParse(row.content);
    if (parsed.success) out.set(row.slug, parsed.data);
  }
  return out;
});

/** A service page's text with the owner's edits applied, and the owner's photos when they replaced the defaults. */
export async function getServicePageContent(slug: ServiceSlug): Promise<{ copy: ServicePageCopy; photos: ServicePhoto[] | undefined }> {
  const override = (await readOverrides()).get(slug);
  const base: ServicePageCopy = SERVICE_PAGES[slug];
  return { copy: mergeServiceCopy(base, override), photos: override?.photos?.length ? override.photos : undefined };
}
