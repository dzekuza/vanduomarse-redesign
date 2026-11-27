"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { eventSchema, type EventFormValues } from "./event-schema";
import { EventSpaceSelect } from "./event-space-select";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/park-events";
import type { ManagedEvent } from "@/lib/admin/types";
import { eventWindow, spaceTakenBy } from "@/lib/space-booking";
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
  /** When creating, copy this event's details (duplicate); the copy is a new event with no tickets sold or held. */
  template?: ManagedEvent;
  /** When creating, start in this category and hide the category picker (e.g. a sauna session from the sauna admin). */
  presetCategory?: EventCategory;
  /** When creating, start on this day (yyyy-mm-dd), e.g. from a calendar cell. */
  presetDate?: string;
  /** When creating, start in this event space (from the Erdvės page). */
  presetSpaceId?: string;
}

/** A sauna session's place is "Sauna" or "Sauna · attendant"; the form edits the sauna, the attendant suffix is kept. */
const venueOf = (place: string) => place.split(" · ")[0];
const attendantSuffix = (place?: string) => (place?.includes(" · ") ? ` · ${place.split(" · ").slice(1).join(" · ")}` : "");

function toValues(e?: ManagedEvent, presetCategory?: EventCategory, presetDate?: string, defaultPlace = "Skoniai Marse", presetSpaceId = ""): EventFormValues {
  return {
    title: e?.title ?? "",
    category: e?.category ?? presetCategory ?? "vakarai",
    date: e?.date ?? presetDate ?? "",
    time: e?.time ?? "19:00",
    durationMinutes: e?.durationMinutes == null ? (!e && presetSpaceId ? "180" : "") : String(e.durationMinutes),
    place: e ? (presetCategory === "pirtis" ? venueOf(e.place) : e.place) : defaultPlace,
    // While a sale runs the form shows the regular price in "Kaina" and the charged price in "Akcijos kaina".
    price: e?.regularPrice != null ? String(e.regularPrice) : e?.price == null ? "" : String(e.price),
    salePrice: e?.regularPrice != null && e.price != null ? String(e.price) : "",
    capacity: e?.capacity == null ? "" : String(e.capacity),
    blurb: e?.blurb ?? "",
    visibility: e?.calendarPrivate ? "private" : e?.published ? "public" : "draft",
    programId: e?.programId ?? "",
    saunaMasterId: e?.saunaMasterId ?? "",
    spaceId: e ? (e.spaceId ?? "") : presetSpaceId,
  };
}

/** Wording when the dialog is opened for one kind of event (a sauna session, a quad tour) instead of a generic event. */
const KIND_COPY: Partial<Record<EventCategory, { nom: string; acc: string; created: string; updated: string }>> = {
  pirtis: { nom: "seansas", acc: "seansą", created: "Seansas sukurtas", updated: "Seansas atnaujintas" },
};

/** Create or edit an event. Remounted per event (key) so defaults reset. */
export function EventDialog({ open, onOpenChange, event, template, presetCategory, presetDate, presetSpaceId }: EventDialogProps) {
  const source = event ?? template;
  const { saveEvent, programs, saunas, saunaMasters, spaces, spaceBookings, events } = useAdmin();
  const sessionDialog = presetCategory === "pirtis";
  const saunaNames = saunas.map((s) => s.name);
  const presetSpace = spaces.find((s) => s.id === presetSpaceId);
  const defaultPlace = sessionDialog ? ((saunas.find((s) => s.active) ?? saunas[0])?.name ?? "Pirtis Marse") : presetSpace?.label;
  const { register, control, handleSubmit, setError, setValue, formState } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: toValues(source, presetCategory, presetDate, defaultPlace, presetSpaceId),
  });
  const lockCategory = !!presetCategory;
  const copy = presetCategory ? KIND_COPY[presetCategory] : undefined;
  const category = useWatch({ control, name: "category" });
  const programId = useWatch({ control, name: "programId" });
  const sessionPrograms = programs.filter((p) => p.kind === "session");
  const program = sessionPrograms.find((p) => p.id === programId);
  const saunaMasterId = useWatch({ control, name: "saunaMasterId" });
  // Active masters, plus the session's own one if it has since been switched off, so editing never drops it silently.
  const masterChoices = saunaMasters.filter((m) => m.active || m.id === saunaMasterId);
  const spaceId = useWatch({ control, name: "spaceId" });
  // Active spaces, plus the event's own one if it has since been switched off.
  const spaceChoices = spaces.filter((s) => s.active || s.id === spaceId);
  const inSpace = category !== "pirtis" && spaceId !== "";
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const space = v.category !== "pirtis" && v.spaceId ? v.spaceId : undefined;
    if (space) {
      const taken = spaceTakenBy([space], eventWindow(v.date, v.time, Number(v.durationMinutes)), spaceBookings, events, spaces, event?.id);
      if (taken) return setError("spaceId", { message: `Erdvė šiuo laiku užimta: ${taken}.` });
    }
    const result = await saveEvent({
      id: event?.id ?? crypto.randomUUID(),
      title: v.title,
      category: v.category as EventCategory,
      date: v.date,
      time: v.time,
      durationMinutes: v.category === "pirtis" || space ? (v.durationMinutes ? Number(v.durationMinutes) : undefined) : source?.durationMinutes,
      // A chosen master replaces the old "Pirtis · name" text suffix, which the public page reads as the host.
      place: sessionDialog ? `${v.place}${v.saunaMasterId ? "" : attendantSuffix(source?.place)}` : v.place,
      blurb: v.blurb,
      price: program ? program.price : v.salePrice !== "" ? Number(v.salePrice) : v.price === "" ? null : Number(v.price),
      regularPrice: !program && v.salePrice !== "" ? Number(v.price) : undefined,
      capacity: v.capacity === "" ? null : Number(v.capacity),
      sold: event?.sold ?? 0,
      held: event?.held ?? 0,
      published: v.visibility === "public",
      calendarPrivate: v.visibility === "private" || source?.calendarPrivate ? v.visibility === "private" : undefined,
      programId: v.category === "pirtis" && program ? program.id : undefined,
      saunaMasterId: v.category === "pirtis" && v.saunaMasterId ? v.saunaMasterId : undefined,
      spaceId: space,
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
          {category === "pirtis"
            ? field(
                "saunaMasterId",
                "Pirtininkas",
                <Controller
                  control={control}
                  name="saunaMasterId"
                  render={({ field: f }) => (
                    <Select value={f.value || "none"} onValueChange={(v) => f.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger id="saunaMasterId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Be pirtininko</SelectItem>
                        {masterChoices.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.active ? m.name : `${m.name} (išjungtas)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />,
                masterChoices.length ? undefined : "Pirtininkų dar nėra: pridėkite juos Pirtis → Pirtininkai.",
              )
            : null}
          {category !== "pirtis" && spaceChoices.length
            ? field(
                "spaceId",
                "Erdvė",
                <Controller
                  control={control}
                  name="spaceId"
                  render={({ field: f }) => (
                    <EventSpaceSelect
                      id="spaceId"
                      value={f.value}
                      spaces={spaceChoices}
                      invalid={!!err.spaceId}
                      onChange={(next, space) => {
                        f.onChange(next);
                        if (space) setValue("place", space.label, { shouldValidate: true });
                      }}
                    />
                  )}
                />,
                "Pasirinkta erdvė renginio metu užimama: jos nebus galima išnuomoti.",
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
          ) : inSpace ? field(
            "durationMinutes",
            "Trukmė (min.)",
            <Input id="durationMinutes" inputMode="numeric" placeholder="180" aria-describedby="durationMinutes-hint" aria-invalid={!!err.durationMinutes} {...register("durationMinutes")} />,
            "Tiek laiko erdvė bus užimta.",
          ) : null}
          {field("price", "Kaina, €", <Input id="price" inputMode="decimal" placeholder={program ? `Pagal programą: ${program.price} €` : "Nemokamai"} disabled={!!program} aria-invalid={!!err.price} {...register("price")} />)}
          {program
            ? null
            : field(
                "salePrice",
                "Akcijos kaina, €",
                <Input id="salePrice" inputMode="decimal" placeholder="Be akcijos" aria-describedby="salePrice-hint" aria-invalid={!!err.salePrice} {...register("salePrice")} />,
                "Svetainėje rodoma vietoje kainos, sena kaina perbraukta.",
              )}
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
