import { z } from "zod";
import { MAX_PAGE_PHOTOS } from "@/lib/page-content";

const required = (what: string, max: number) => z.string().trim().min(1, `Įveskite ${what}.`).max(max, `Daugiausia ${max} simbolių.`);
const optional = (max: number) => z.string().trim().max(max, `Daugiausia ${max} simbolių.`);

/** The editor's form: every field as shown (the saved override keeps only what differs from the code default). */
export const pageEditorSchema = z.object({
  title: required("pavadinimą", 160),
  summary: required("santrauką", 600),
  description: required("aprašymą", 3000),
  metaDescription: optional(200),
  bookingIntro: optional(400),
  availabilityNote: optional(400),
  facts: z.array(z.object({ label: required("pavadinimą", 80), value: required("tekstą", 500) })).max(12),
  questions: z.array(z.object({ title: required("klausimą", 200), body: required("atsakymą", 1500) })).max(20),
  photos: z.array(z.object({ src: z.string().min(1), alt: optional(200) })).max(MAX_PAGE_PHOTOS),
});

export type PageEditorValues = z.infer<typeof pageEditorSchema>;
