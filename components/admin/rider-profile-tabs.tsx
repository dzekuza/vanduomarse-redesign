"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CameraIcon, DownloadSimpleIcon, FileIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "./admin-store";
import { formatDateTime } from "@/lib/admin/format";
import type { Rider } from "@/lib/admin/types";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormPhoneInput } from "@/components/ui/phone-input";

/**
 * Rider/customer profile, documents and comments tabs — shared by Apyrankės's
 * `RiderPage` and Klientai's `CustomerPage` (ADR-0042: the same `riders` row is
 * a bracelet-pass rider and a Klientai customer).
 */

const profileSchema = z.object({
  name: z.string().trim().min(1, "Įveskite vardą.").max(60),
  surname: z.string().trim().min(1, "Įveskite pavardę.").max(60),
  phone: z.string().trim().max(30),
  phone2: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("Netinkamas el. paštas.")]),
  birthdate: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;

/** The signed registration waiver (/registracija), if this rider self-registered — a date and a link to the signature. */
function WaiverStatus({ riderId }: { riderId: string }) {
  const { riderWaivers, getRiderFileUrl } = useAdmin();
  const [opening, setOpening] = useState(false);
  const waiver = riderWaivers.find((w) => w.riderId === riderId);
  if (!waiver) return null;

  async function openSignature() {
    if (!waiver!.signaturePath) return;
    setOpening(true);
    const result = await getRiderFileUrl("rider-waivers", waiver!.signaturePath);
    setOpening(false);
    if ("data" in result) window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
      Taisyklės pasirašytos {formatDateTime(waiver.signedAt)}.{" "}
      {waiver.signaturePath ? (
        <button type="button" className="underline underline-offset-4 disabled:opacity-50" disabled={opening} onClick={openSignature}>
          Peržiūrėti parašą
        </button>
      ) : (
        "Parašo failas nerastas."
      )}
    </p>
  );
}

export function RiderProfileTab({ rider }: { rider: Rider }) {
  const { updateRiderProfile, uploadRiderAvatar, removeRiderAvatar } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { register, control, handleSubmit, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: rider.name,
      surname: rider.surname,
      phone: rider.phone ?? "",
      phone2: rider.phone2 ?? "",
      email: rider.email ?? "",
      birthdate: rider.birthdate ?? "",
    },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await updateRiderProfile(rider.id, {
      name: v.name,
      surname: v.surname,
      phone: v.phone || null,
      phone2: v.phone2 || null,
      email: v.email || null,
      birthdate: v.birthdate || null,
    });
    if ("data" in result) toast.success("Profilis atnaujintas");
  });

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    const result = await uploadRiderAvatar(rider.id, form);
    setUploading(false);
    if ("data" in result) toast.success("Nuotrauka įkelta");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <WaiverStatus riderId={rider.id} />
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleAvatarPick} />
        <Button type="button" variant="outline" size="sm" className="min-h-9" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <CameraIcon size={16} /> {rider.avatarPath ? "Keisti nuotrauką" : "Įkelti nuotrauką"}
        </Button>
        {rider.avatarPath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-9"
            onClick={async () => {
              const result = await removeRiderAvatar(rider.id);
              if ("data" in result) toast.success("Nuotrauka pašalinta");
            }}
          >
            Šalinti
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="r-name">Vardas</Label>
          <Input id="r-name" aria-invalid={!!err.name} {...register("name")} />
          {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-surname">Pavardė</Label>
          <Input id="r-surname" aria-invalid={!!err.surname} {...register("surname")} />
          {err.surname ? <p className="text-xs text-destructive">{err.surname.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-phone">Telefonas</Label>
          <FormPhoneInput<ProfileValues> name="phone" control={control} id="r-phone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-phone2">Papildomas telefonas</Label>
          <FormPhoneInput<ProfileValues> name="phone2" control={control} id="r-phone2" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-email">El. paštas</Label>
          <Input id="r-email" type="email" aria-invalid={!!err.email} {...register("email")} />
          {err.email ? <p className="text-xs text-destructive">{err.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-birthdate">Gimimo data</Label>
          <Controller
            control={control}
            name="birthdate"
            render={({ field }) => <DatePicker id="r-birthdate" value={field.value} onChange={field.onChange} max={todayKey()} placeholder="Nenurodyta" />}
          />
        </div>
      </div>

      <Button type="submit" className="min-h-11 w-full sm:w-auto">
        Išsaugoti
      </Button>
    </form>
  );
}

export function RiderDocumentsTab({ riderId }: { riderId: string }) {
  const { riderDocuments, addRiderDocument, deleteRiderDocument, getRiderFileUrl } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const docs = riderDocuments.filter((d) => d.riderId === riderId);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    const result = await addRiderDocument(riderId, form);
    setUploading(false);
    if ("data" in result) toast.success("Dokumentas įkeltas");
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handlePick} />
      <Button type="button" variant="outline" size="sm" className="min-h-9" disabled={uploading} onClick={() => fileRef.current?.click()}>
        <UploadSimpleIcon size={16} /> Įkelti dokumentą
      </Button>

      {docs.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">Dokumentų nėra.</p>
      ) : (
        <ul className="divide-y">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0">
              <FileIcon size={20} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(d.uploadedAt)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Atsisiųsti ${d.fileName}`}
                onClick={async () => {
                  const result = await getRiderFileUrl("rider-documents", d.filePath);
                  if ("data" in result) window.open(result.data.url, "_blank");
                }}
              >
                <DownloadSimpleIcon size={18} />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Ištrinti ${d.fileName}`} onClick={() => deleteRiderDocument(d.id)}>
                <TrashIcon size={18} className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RiderCommentsTab({ riderId }: { riderId: string }) {
  const { riderComments, addRiderComment, deleteRiderComment } = useAdmin();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const comments = riderComments.filter((c) => c.riderId === riderId);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    const result = await addRiderComment(riderId, text.trim());
    setSaving(false);
    if ("data" in result) setText("");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea placeholder="Pastaba apie naudotoją…" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        <Button type="button" size="sm" className="min-h-9" disabled={!text.trim() || saving} onClick={submit}>
          Pridėti
        </Button>
      </div>

      {comments.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">Komentarų nėra.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 bg-muted p-3 text-sm">
              <div>
                <p>{c.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.authorName} · {formatDateTime(c.createdAt)}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Ištrinti komentarą" onClick={() => deleteRiderComment(c.id)}>
                <TrashIcon size={16} className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
