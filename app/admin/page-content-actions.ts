"use server";

import { revalidatePath } from "next/cache";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { isServiceSlug } from "@/components/services/service-content";
import { PAGE_PHOTO_BUCKET, pageContentSchema, pagePhotoPath, pagePhotoUrl, type PageContentOverride } from "@/lib/page-content";
import { supabaseEnv } from "@/lib/supabase/env";

/** /admin/puslapiai writes: owner-only edits of the public service pages (RLS enforces the same). */

const PHOTO_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

/** The object path of a photo in our own bucket on our own Supabase host; null for anything else (another host, a local file). */
const ownBucketPath = (src: string) => (src.startsWith(`${supabaseEnv().url}/`) ? pagePhotoPath(src) : null);

/** A photo is either one of the site's own files (`/landing/...`) or one uploaded for this page. */
const isOwnPhoto = (slug: string, src: string) => (src.startsWith("/landing/") && !src.includes("..")) || ownBucketPath(src)?.startsWith(`${slug}/`) === true;

/** Refreshes the cached page and the sitemap (its `lastmod` comes from `page_content`) so visitors and crawlers see the change at once. */
const revalidatePage = (slug: string) => {
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");
};

/** Saves the overrides for one page. An empty object removes the row (back to the defaults). Photos no longer listed are deleted from storage. */
export async function savePageContent(slug: string, input: unknown): Promise<ActionResult<PageContentOverride>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!isServiceSlug(slug)) return fail("Puslapis nerastas.", "not_found");
  const parsed = pageContentSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite laukus: vienas ar daugiau netinkami.", "invalid");
  const content = parsed.data;
  if (content.photos?.some((p) => !isOwnPhoto(slug, p.src))) return fail("Netinkama nuotrauka.", "invalid");
  const { supabase } = ctx;

  const { data: before } = await supabase.from("page_content").select("content").eq("slug", slug).maybeSingle();
  const previous = pageContentSchema.safeParse(before?.content);
  const keptSrc = new Set((content.photos ?? []).map((p) => p.src));
  const orphaned = (previous.success ? (previous.data.photos ?? []) : []).map((p) => p.src).filter((src) => !keptSrc.has(src));

  if (Object.keys(content).length === 0) {
    const { error } = await supabase.from("page_content").delete().eq("slug", slug);
    if (error) return dbError(error);
  } else {
    const { error } = await supabase.from("page_content").upsert({ slug, content });
    if (error) return dbError(error);
  }
  const paths = orphaned.map(ownBucketPath).filter((p): p is string => p !== null);
  if (paths.length) await supabase.storage.from(PAGE_PHOTO_BUCKET).remove(paths);
  revalidatePage(slug);
  return done(content);
}

/** Uploads one photo for a page and returns its public URL; it joins the page's gallery when the editor saves. */
export async function uploadPagePhoto(slug: string, form: FormData): Promise<ActionResult<{ src: string }>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const file = form.get("file");
  if (!isServiceSlug(slug) || !(file instanceof File)) return fail("Netinkamos reikšmės.", "invalid");
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return fail("Tinka JPG, PNG, WebP arba AVIF nuotraukos.", "invalid");
  if (file.size > 5 * 1024 * 1024) return fail("Nuotrauka per didelė (daugiausia 5 MB).", "invalid");
  const path = `${slug}/${crypto.randomUUID()}.${ext}`;
  const { error } = await ctx.supabase.storage.from(PAGE_PHOTO_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return fail("Nepavyko įkelti nuotraukos. Bandykite dar kartą.", "storage");
  return { data: { src: pagePhotoUrl(supabaseEnv().url, path) } };
}
