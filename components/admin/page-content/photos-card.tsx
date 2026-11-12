"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { RowControls } from "./row-controls";
import type { PageEditorValues } from "./page-content-schema";
import { resizeImage } from "@/lib/image-resize";
import { MAX_PAGE_PHOTOS } from "@/lib/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PhotosCardProps {
  slug: string;
  control: Control<PageEditorValues>;
  register: UseFormRegister<PageEditorValues>;
}

/** A page's gallery: upload, describe (alt text), reorder and remove. The first photo is the hero. Saved with the rest of the page. */
export function PhotosCard({ slug, control, register }: PhotosCardProps) {
  const { uploadPagePhoto } = useAdmin();
  const { fields, append, remove, move } = useFieldArray({ control, name: "photos" });
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const room = MAX_PAGE_PHOTOS - fields.length;

  async function upload(files: FileList | null) {
    const picked = Array.from(files ?? []).slice(0, room);
    if (files && files.length > picked.length) toast.error(`Daugiausia ${MAX_PAGE_PHOTOS} nuotraukų.`);
    for (const [i, file] of picked.entries()) {
      setUploading(picked.length - i);
      const form = new FormData();
      form.append("file", await resizeImage(file));
      const result = await uploadPagePhoto(slug, form);
      if ("error" in result) break;
      append({ src: result.data.src, alt: "" });
    }
    setUploading(0);
    if (input.current) input.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuotraukos</CardTitle>
        <CardDescription>
          Pirmoji nuotrauka rodoma puslapio viršuje. Kai nuotraukų nėra, rodomos numatytosios. Pakeitimai įsigalioja paspaudus „Išsaugoti“. Iki {MAX_PAGE_PHOTOS}, sumažinamos automatiškai.
        </CardDescription>
        <CardAction>
          <Button type="button" className="min-h-11" onClick={() => input.current?.click()} disabled={room <= 0 || uploading > 0}>
            <UploadSimpleIcon size={18} />
            {uploading ? `Įkeliama (${uploading})…` : "Įkelti"}
          </Button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nuotraukų nėra.</p>
        ) : (
          <ul className="divide-y">
            {fields.map((field, i) => (
              <li key={field.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center">
                <div className="relative aspect-4/3 w-full shrink-0 bg-muted sm:w-40">
                  <Image src={field.src} alt={field.alt || `Nuotrauka ${i + 1}`} fill sizes="(min-width: 640px) 10rem, 100vw" className="object-cover" />
                  {i === 0 ? <span className="absolute top-2 left-2 bg-ink px-2 py-0.5 text-xs text-foam">Viršelis</span> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`photo-alt-${i}`} className="mb-1.5 block text-sm font-medium">
                    Aprašymas (alt)
                  </label>
                  <Input id={`photo-alt-${i}`} className="min-h-11" placeholder="Ką rodo nuotrauka" {...register(`photos.${i}.alt`)} />
                </div>
                <RowControls index={i} count={fields.length} label={`Nuotrauka ${i + 1}`} onMove={move} onRemove={() => remove(i)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
