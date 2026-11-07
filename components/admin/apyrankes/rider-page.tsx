"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CameraIcon, DownloadSimpleIcon, FileIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { PlanBadge } from "./plan-badge";
import { RiderAvatar } from "./rider-avatar";
import { formatDateTime } from "@/lib/admin/format";
import type { Purchase, Rider } from "@/lib/admin/types";
import { formatPlanPrice } from "@/lib/ride-plans";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Įveskite vardą.").max(60),
  surname: z.string().trim().min(1, "Įveskite pavardę.").max(60),
  phone: z.string().trim().max(30),
  phone2: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("Netinkamas el. paštas.")]),
  birthdate: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const BACK_HREF = "/admin/apyrankes?tab=nariai";

/** `/admin/apyrankes/[id]`: rider details — profile, sales history, active services, subscriptions, documents, comments. */
export function RiderPage({ id }: { id: string }) {
  const { riders } = useAdmin();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const rider = riders.find((r) => r.id === id);

  const back = (
    <Button variant="outline" asChild>
      <Link href={BACK_HREF}>
        <ArrowLeftIcon size={18} /> Visi naudotojai
      </Link>
    </Button>
  );

  if (!rider) {
    return (
      <AdminPage title="Naudotojas nerastas" description="Jis galėjo būti pašalintas." actions={back}>
        {null}
      </AdminPage>
    );
  }

  return (
    <AdminPage title={`${rider.name} ${rider.surname}`} actions={back}>
      <div className="flex items-center gap-3">
        <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} className="size-10" />
        <PlanBadge planId={rider.planId} />
      </div>

      <Tabs defaultValue="profilis">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profilis" className="min-h-11 shrink-0">
            Profilis
          </TabsTrigger>
          <TabsTrigger value="pardavimai" className="min-h-11 shrink-0">
            Pardavimai
          </TabsTrigger>
          <TabsTrigger value="aktyvios" className="min-h-11 shrink-0">
            Aktyvios paslaugos
          </TabsTrigger>
          <TabsTrigger value="abonementai" className="min-h-11 shrink-0">
            Abonementai
          </TabsTrigger>
          <TabsTrigger value="dokumentai" className="min-h-11 shrink-0">
            Dokumentai
          </TabsTrigger>
          <TabsTrigger value="komentarai" className="min-h-11 shrink-0">
            Komentarai
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profilis" className="mt-4">
          <ProfileTab rider={rider} />
        </TabsContent>
        <TabsContent value="pardavimai" className="mt-4">
          <SalesList riderId={rider.id} filter="all" empty="Pardavimų dar nėra." />
        </TabsContent>
        <TabsContent value="aktyvios" className="mt-4">
          <SalesList riderId={rider.id} filter="active" empty="Šiandien paslaugų neparduota." />
        </TabsContent>
        <TabsContent value="abonementai" className="mt-4">
          <SalesList riderId={rider.id} filter="subscriptions" empty="Abonementų nėra." />
        </TabsContent>
        <TabsContent value="dokumentai" className="mt-4">
          <DocumentsTab riderId={rider.id} />
        </TabsContent>
        <TabsContent value="komentarai" className="mt-4">
          <CommentsTab riderId={rider.id} />
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <Button variant="destructive" className="min-h-11 w-full sm:w-auto" onClick={() => setDeleting(true)}>
          <TrashIcon size={18} /> Pašalinti naudotoją
        </Button>
      </div>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Pašalinti {rider.name} {rider.surname}?
            </DialogTitle>
            <DialogDescription>Jų apyrankė, dokumentai, pardavimų istorija ir komentarai bus negrąžinamai ištrinti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Palikti
            </Button>
            <DeleteRiderButton riderId={rider.id} onDone={() => router.push(BACK_HREF)} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function DeleteRiderButton({ riderId, onDone }: { riderId: string; onDone: () => void }) {
  const { deleteRider } = useAdmin();
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        const result = await deleteRider(riderId);
        if ("data" in result) {
          toast.success("Naudotojas pašalintas");
          onDone();
        }
      }}
    >
      Pašalinti
    </Button>
  );
}

function ProfileTab({ rider }: { rider: Rider }) {
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
      <div className="flex items-center gap-3">
        <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} className="size-14" />
        <div className="flex gap-2">
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
          <Input id="r-phone" type="tel" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-phone2">Papildomas telefonas</Label>
          <Input id="r-phone2" type="tel" {...register("phone2")} />
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

type SalesFilter = "all" | "active" | "subscriptions";

function filterPurchases(purchases: Purchase[], riderId: string, filter: SalesFilter): Purchase[] {
  const own = purchases.filter((p) => p.riderId === riderId);
  if (filter === "all") return own;
  if (filter === "subscriptions") return own.filter((p) => p.planCategory === "Abonementai");
  const today = todayKey();
  return own.filter((p) => p.planCategory !== "Abonementai" && p.soldAt.slice(0, 10) === today);
}

function SalesList({ riderId, filter, empty }: { riderId: string; filter: SalesFilter; empty: string }) {
  const { purchases } = useAdmin();
  const rows = filterPurchases(purchases, riderId, filter);

  if (rows.length === 0) return <p className="py-3 text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="divide-y">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-normal">{p.planName}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(p.soldAt)}</p>
          </div>
          <p className="shrink-0 font-display text-sm font-bold tabular-nums">{formatPlanPrice(p.price)}</p>
        </li>
      ))}
    </ul>
  );
}

function DocumentsTab({ riderId }: { riderId: string }) {
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
                <p className="truncate text-sm font-normal">{d.fileName}</p>
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

function CommentsTab({ riderId }: { riderId: string }) {
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
