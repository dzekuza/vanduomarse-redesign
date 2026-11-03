"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { eventSchema, type EventFormValues } from "./event-schema";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/park-events";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing event to edit; omit to create. */
  event?: ManagedEvent;
}

function toValues(e?: ManagedEvent): EventFormValues {
  return {
    title: e?.title ?? "",
    category: e?.category ?? "vakarai",
    date: e?.date ?? "",
    time: e?.time ?? "19:00",
    place: e?.place ?? "Skoniai Marse",
    price: e?.price == null ? "" : String(e.price),
    capacity: e?.capacity == null ? "" : String(e.capacity),
    blurb: e?.blurb ?? "",
    published: e?.published ?? false,
    programId: e?.programId ?? "",
  };
}

/** Create or edit an event. Remounted per event (key) so defaults reset. */
export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const { saveEvent, programs } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: toValues(event),
  });
  const category = useWatch({ control, name: "category" });
  const programId = useWatch({ control, name: "programId" });
  const sessionPrograms = programs.filter((p) => p.kind === "session");
  const program = sessionPrograms.find((p) => p.id === programId);
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveEvent({
      id: event?.id ?? crypto.randomUUID(),
      title: v.title,
      category: v.category as EventCategory,
      date: v.date,
      time: v.time,
      durationMinutes: event?.durationMinutes,
      place: v.place,
      blurb: v.blurb,
      price: program ? program.price : v.price === "" ? null : Number(v.price),
      capacity: v.capacity === "" ? null : Number(v.capacity),
      sold: event?.sold ?? 0,
      published: v.published,
      programId: v.category === "pirtis" && program ? program.id : undefined,
    });
    toast.success(event ? "Renginys atnaujintas" : "Renginys sukurtas");
    onOpenChange(false);
  });

  const field = (id: keyof EventFormValues, label: string, input: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {err[id] ? <p className="text-xs text-destructive">{err[id]?.message}</p> : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Redaguoti renginį" : "Naujas renginys"}</DialogTitle>
          <DialogDescription>Kainą ar vietų skaičių palikite tuščią, jei įėjimas nemokamas ar vietų neribojame.</DialogDescription>
        </DialogHeader>
        <form id="event-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("title", "Pavadinimas", <Input id="title" aria-invalid={!!err.title} {...register("title")} />)}</div>
          {field(
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
          {field("place", "Vieta", <Input id="place" aria-invalid={!!err.place} {...register("place")} />)}
          {field("date", "Data", <Input id="date" type="date" aria-invalid={!!err.date} {...register("date")} />)}
          {field("time", "Laikas", <Input id="time" type="time" aria-invalid={!!err.time} {...register("time")} />)}
          {field("price", "Kaina, €", <Input id="price" inputMode="decimal" placeholder={program ? `Pagal programą: ${program.price} €` : "Nemokamai"} disabled={!!program} aria-invalid={!!err.price} {...register("price")} />)}
          {field("capacity", "Vietų skaičius", <Input id="capacity" inputMode="numeric" placeholder="Neribota" aria-invalid={!!err.capacity} {...register("capacity")} />)}
          <div className="sm:col-span-2">{field("blurb", "Aprašymas", <Textarea id="blurb" rows={3} aria-invalid={!!err.blurb} {...register("blurb")} />)}</div>
          <Controller
            control={control}
            name="published"
            render={({ field: f }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch checked={f.value} onCheckedChange={f.onChange} />
                Paskelbti svetainėje
              </label>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="event-form">
            {event ? "Išsaugoti" : "Sukurti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
