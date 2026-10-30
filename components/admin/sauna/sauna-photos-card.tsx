"use client";

import { ArrowLeftIcon, ArrowRightIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { resizeImage } from "@/lib/image-resize";
import { MAX_SAUNA_PHOTOS, type Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Upload, order and remove a sauna's photos; changes save immediately. The first photo is the cover. */
export function SaunaPhotosCard({ sauna }: { sauna: Sauna }) {
  const { uploadSaunaPhoto, removeSaunaPhoto, reorderSaunaPhotos } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const paths = sauna.photos.map((p) => p.path);
  const room = MAX_SAUNA_PHOTOS - paths.length;

  async function upload(files: FileList | null) {
    const picked = Array.from(files ?? []).slice(0, room);
    if (files && files.length > picked.length) toast.error(`Daugiausia ${MAX_SAUNA_PHOTOS} nuotraukų.`);
    for (const [i, file] of picked.entries()) {
      setUploading(picked.length - i);
      const form = new FormData();
      form.append("file", await resizeImage(file));
      const result = await uploadSaunaPhoto(sauna.id, form);
      if ("error" in result) break;
    }
    setUploading(0);
    if (input.current) input.current.value = "";
  }

  const move = (from: number, to: number) => {
    const next = [...paths];
    next.splice(to, 0, ...next.splice(from, 1));
    reorderSaunaPhotos(sauna.id, next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuotraukos</CardTitle>
        <CardDescription>Pirmoji nuotrauka rodoma kortelėje. Iki {MAX_SAUNA_PHOTOS} nuotraukų, sumažinamos automatiškai.</CardDescription>
        <CardAction>
          <Button type="button" onClick={() => input.current?.click()} disabled={room <= 0 || uploading > 0}>
            <UploadSimpleIcon size={18} />
            {uploading ? `Įkeliama (${uploading})…` : "Įkelti"}
          </Button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {sauna.photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nuotraukų dar nėra. Be jų kortelėje rodomas pirties ženkliukas.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sauna.photos.map((photo, i) => (
              <li key={photo.path} className="border">
                <div className="relative aspect-4/3 bg-muted">
                  <Image src={photo.url} alt={`${sauna.name}, nuotrauka ${i + 1}`} fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />
                  {i === 0 ? <span className="absolute top-2 left-2 bg-ink px-2 py-0.5 text-xs text-foam">Viršelis</span> : null}
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="ghost" size="icon" aria-label="Perkelti į kairę" disabled={i === 0} onClick={() => move(i, i - 1)}>
                    <ArrowLeftIcon size={18} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Pašalinti nuotrauką ${i + 1}`}
                    onClick={() => removeSaunaPhoto(sauna.id, photo.path, paths.filter((p) => p !== photo.path))}
                  >
                    <TrashIcon size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Perkelti į dešinę" disabled={i === paths.length - 1} onClick={() => move(i, i + 1)}>
                    <ArrowRightIcon size={18} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
