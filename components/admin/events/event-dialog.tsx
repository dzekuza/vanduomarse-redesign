"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { eventSchema, type EventFormValues } from "./event-schema";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/park-events";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing event to edit; omit to create. */
  event?: ManagedEvent;
  /** When creating, start in this category and hide the category picker (e.g. a sauna session from the sauna admin). */
  presetCategory?: EventCategory;
  /** When creating, start on this day (yyyy-mm-dd), e.g. from a calendar cell. */
  presetDate?: string;
}

/** A sauna session's place is "Sauna" or "Sauna · attendant"; the form edits the sauna, the attendant suffix is kept. */
const venueOf = (place: string) => place.split(" · ")[0];
const attendantSuffix = (place?: string) => (place?.includes(" · ") ? ` · ${place.split(" · ").slice(1).join(" · ")}` : "");

function toValues(e?: ManagedEvent, presetCategory?: EventCategory, presetDate?: string, defaultPlace = "Skoniai Marse"): EventFormValues {
  return {
    title: e?.title ?? "",
    category: e?.category ?? presetCategory ?? "vakarai",
    date: e?.date ?? presetDate ?? "",
    time: e?.time ?? "19:00",
    durationMinutes: e?.durationMinutes == null ? "" : String(e.durationMinutes),
    place: e ? (presetCategory === "pirtis" ? venueOf(e.place) : e.place) : defaultPlace,
    price: e?.price == null ? "" : String(e.price),
    capacity: e?.capacity == null ? "" : String(e.capacity),
    blurb: e?.blurb ?? "",
    visibility: e?.calendarPrivate ? "private" : e?.published ? "public" : "draft",
    programId: e?.programId ?? "",
  };
}

/** Wording when the dialog is opened for one kind of event (a sauna session, a quad tour) instead of a generic event. */
const KIND_COPY: Partial<Record<EventCategory, { nom: string; acc: string; created: string; updated: string }>> = {
  pirtis: { nom: "seansas", acc: "seansą", created: "Seansas sukurtas", updated: "Seansas atnaujintas" },
};

/** Create or edit an event. Remounted per event (key) so defaults reset. */
export function EventDialog({ open, onOpenChange, event, presetCategory, presetDate }: EventDialogProps) {
  const { saveEvent, programs, saunas } = useAdmin();
  const sessionDialog = presetCategory === "pirtis";
  const saunaNames = saunas.map((s) => s.name);
  const { register, control, handleSubmit, setError, formState } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: toValues(event, presetCategory, presetDate, sessionDialog ? ((saunas.find((s) => s.active) ?? saunas[0])?.name ?? "Pirtis Marse") : undefined),
  });
  const lockCategory = !!presetCategory;
  const copy = presetCategory ? KIND_COPY[presetCategory] : undefined;
  const category = useWatch({ control, name: "category" });
  const programId = useWatch({ control, name: "programId" });
  const sessionPrograms = programs.filter((p) => p.kind === "session");
  const program = sessionPrograms.find((p) => p.id === programId);
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveEvent({
      id: event?.id ?? crypto.randomUUID(),
      title: v.title,
      category: v.category as EventCategory,
      date: v.date,
      time: v.time,
      durationMinutes: v.category === "pirtis" ? (v.durationMinutes ? Number(v.durationMinutes) : undefined) : event?.durationMinutes,
      place: sessionDialog ? `${v.place}${attendantSuffix(event?.place)}` : v.place,
      blurb: v.blurb,
      price: program ? program.price : v.price === "" ? null : Number(v.price),
      capacity: v.capacity === "" ? null : Number(v.capacity),
      sold: event?.sold ?? 0,
      held: event?.held ?? 0,
      published: v.visibility === "public",
      calendarPrivate: v.visibility === "private" || event?.calendarPrivate ? v.visibility === "private" : undefined,
      programId: v.category === "pirtis" && program ? program.id : undefined,
    });
    if ("error" in result) {
      setError("root", { message: result.error.message });
      return;
    }
    toast.success(copy ? (event ? copy.updated : copy.created) : event ? "Renginys atnaujintas" : "Renginys sukurtas");
    onOpenChange(false);
  });

  const field = (id: keyof EventFormValues, label: string, input: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
      {err[id] ? <p className="text-xs text-destructive">{err[id]?.message}</p> : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? `Redaguoti ${copy?.acc ?? "renginį"}` : `Naujas ${copy?.nom ?? "renginys"}`}</DialogTitle>
          <DialogDescription>Kainą ar vietų skaičių palikite tuščią, jei įėjimas nemokamas ar vietų neribojame.</DialogDescription>
        </DialogHeader>
        <form id="event-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("title", "Pavadinimas", <Input id="title" aria-invalid={!!err.title} {...register("title")} />)}</div>
          {lockCategory
            ? null
            : field(
                "category",
                "Kategorija",
                <Controller
                  control={control}
                  name="category"
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />,
              )}
          {category === "pirtis" && sessionPrograms.length
            ? field(
                "programId",
                "Pirties programa",
                <Controller
                  control={control}
                  name="programId"
                  render={({ field: f }) => (
                    <Select value={f.value || "none"} onValueChange={(v) => f.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger id="programId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Be programos</SelectItem>
                        {sessionPrograms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />,
              )
            : null}
          {sessionDialog
            ? field(
                "place",
                "Pirties tipas",
                <Controller
                  control={control}
                  name="place"
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger id="place" className="w-full" aria-invalid={!!err.place}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(saunaNames.includes(f.value) || !f.value ? saunaNames : [f.value, ...saunaNames]).map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />,
              )
            : field("place", "Vieta", <Input id="place" aria-invalid={!!err.place} {...register("place")} />)}
          {field("date", "Data", <Controller control={control} name="date" render={({ field: f }) => <DatePicker id="date" value={f.value} onChange={f.onChange} invalid={!!err.date} />} />)}
          {field("time", "Laikas", <Input id="time" type="time" aria-invalid={!!err.time} {...register("time")} />)}
          {category === "pirtis" ? field(
            "durationMinutes",
            "Trukmė (min.)",
            <Input id="durationMinutes" inputMode="numeric" placeholder={String(program?.durationMinutes ?? 60)} aria-describedby="durationMinutes-hint" aria-invalid={!!err.durationMinutes} {...register("durationMinutes")} />,
            program ? `Palikus tuščią, taikoma programos trukmė (${program.durationMinutes} min.).` : "Palikus tuščią, taikoma 60 min. trukmė.",
          ) : null}
          {field("price", "Kaina, €", <Input id="price" inputMode="decimal" placeholder={program ? `Pagal programą: ${program.price} €` : "Nemokamai"} disabled={!!program} aria-invalid={!!err.price} {...register("price")} />)}
          {field("capacity", "Vietų skaičius", <Input id="capacity" inputMode="numeric" placeholder="Neribota" aria-invalid={!!err.capacity} {...register("capacity")} />)}
          <div className="sm:col-span-2">{field("blurb", "Aprašymas", <Textarea id="blurb" rows={3} aria-invalid={!!err.blurb} {...register("blurb")} />)}</div>
          <div className="sm:col-span-2">
            {field("visibility", "Matomumas", (
              <Controller control={control} name="visibility" render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger id="visibility" className="min-h-11 w-full" aria-describedby="visibility-hint">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Juodraštis</SelectItem>
                    <SelectItem value="public">Viešas renginys</SelectItem>
                    <SelectItem value="private">Privatus renginys</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            ), "Privataus renginio kalendoriuje rodoma tik data ir žyma „Privatus renginys“.")}
          </div>
          {err.root?.message ? <p role="alert" className="text-xs text-destructive sm:col-span-2">{err.root.message}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="event-form" disabled={formState.isSubmitting}>
            {event ? "Išsaugoti" : "Sukurti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
