import { z } from "zod";
import type { ServicePhoto } from "@/components/landing/content";
import type { ServicePageCopy } from "@/components/services/service-content";

/** Public bucket for photos owners upload in /admin/puslapiai. */
export const PAGE_PHOTO_BUCKET = "page-photos";
export const MAX_PAGE_PHOTOS = 24;

const text = (max: number) => z.string().trim().max(max);

/**
 * What an owner may override on a service page. Every field is optional: a missing field keeps the code
 * default (`components/services/service-content.ts`); `facts`, `questions` and `photos` replace the whole list.
 */
export const pageContentSchema = z
  .object({
    title: text(160).min(1),
    summary: text(600).min(1),
    description: text(3000).min(1),
    metaDescription: text(200),
    bookingIntro: text(400),
    availabilityNote: text(400),
    facts: z.array(z.object({ label: text(80).min(1), value: text(500).min(1) })).max(12),
    questions: z.array(z.object({ title: text(200).min(1), body: text(1500).min(1) })).max(20),
    photos: z.array(z.object({ src: text(600).min(1), alt: text(200) })).max(MAX_PAGE_PHOTOS),
  })
  .partial()
  .strict();

export type PageContentOverride = z.infer<typeof pageContentSchema>;

/** Public URL of a photo in `PAGE_PHOTO_BUCKET`. */
export function pagePhotoUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PAGE_PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** The object path inside `PAGE_PHOTO_BUCKET` for one of our own photo URLs, else null (a local `/landing/...` photo). */
export function pagePhotoPath(src: string): string | null {
  const marker = `/storage/v1/object/public/${PAGE_PHOTO_BUCKET}/`;
  const at = src.indexOf(marker);
  return at === -1 ? null : src.slice(at + marker.length).split("/").map(decodeURIComponent).join("/");
}

/** The code default with the owner's overrides on top. Empty strings in optional text fields clear the default. */
export function mergeServiceCopy(base: ServicePageCopy, override: PageContentOverride | undefined): ServicePageCopy {
  if (!override) return base;
  const { metaDescription, bookingIntro, availabilityNote, photos, ...rest } = override;
  void photos; // photos are applied by the page, not the copy
  return {
    ...base,
    ...rest,
    ...(metaDescription === undefined ? {} : { metaDescription: metaDescription || undefined }),
    ...(bookingIntro === undefined ? {} : { bookingIntro: bookingIntro || undefined }),
    ...(availabilityNote === undefined ? {} : { availabilityNote: availabilityNote || undefined }),
  };
}

/** Only the fields that differ from the default, so untouched fields keep following later code changes. */
export function overrideFromEdit(base: ServicePageCopy, defaultPhotos: ServicePhoto[], edit: Required<Pick<PageContentOverride, "title" | "summary" | "description" | "facts" | "questions" | "photos">> & Pick<PageContentOverride, "metaDescription" | "bookingIntro" | "availabilityNote">): PageContentOverride {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const out: PageContentOverride = {};
  if (edit.title !== base.title) out.title = edit.title;
  if (edit.summary !== base.summary) out.summary = edit.summary;
  if (edit.description !== base.description) out.description = edit.description;
  if ((edit.metaDescription ?? "") !== (base.metaDescription ?? "")) out.metaDescription = edit.metaDescription ?? "";
  if ((edit.bookingIntro ?? "") !== (base.bookingIntro ?? "")) out.bookingIntro = edit.bookingIntro ?? "";
  if ((edit.availabilityNote ?? "") !== (base.availabilityNote ?? "")) out.availabilityNote = edit.availabilityNote ?? "";
  if (!same(edit.facts, base.facts)) out.facts = edit.facts;
  if (!same(edit.questions, base.questions)) out.questions = edit.questions;
  if (!same(edit.photos, defaultPhotos)) out.photos = edit.photos;
  return out;
}
