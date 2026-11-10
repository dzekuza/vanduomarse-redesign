"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { hourLabel } from "@/lib/quads";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  routeId: z.string().min(1, "Pasirinkite turo tipą."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
  hour: z.string().min(1, "Pasirinkite laiką."),
  capacity: z.string().trim().refine((v) => v === "" || /^[1-9]\d{0,2}$/.test(v), "Įveskite sveiką skaičių arba palikite tuščią."),
  published: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** Add or edit one dated departure of a tour type. Name, price, length and description come from the type; only the date, start and quads are set here. */
export function TourDepartureDialog({ event, onOpenChange }: { event?: ManagedEvent; onOpenChange: (open: boolean) => void }) {
  const { quadTourRoutes, quadSettings, saveEvent } = useAdmin();
  const { register, control, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      routeId: event?.tourRouteId ?? "",
      date: event?.date ?? "",
      hour: event ? String(Number(event.time.slice(0, 2))) : "",
      capacity: event?.capacity == null ? "" : String(event.capacity),
      published: event?.published ?? true,
    },
  });
  const routeId = useWatch({ control, name: "routeId" });
  const route = quadTourRoutes.find((r) => r.id === routeId);
  const hours = Array.from({ length: Math.max(0, quadSettings.closeHour - (route?.hours ?? 1) - quadSettings.openHour + 1) }, (_, i) => quadSettings.openHour + i);
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    if (!route) return;
    const result = await saveEvent({
      id: event?.id ?? crypto.randomUUID(),
      title: `${route.name} turas`,
      category: "keturratis",
      date: v.date,
      time: `${String(Number(v.hour)).padStart(2, "0")}:00`,
      durationMinutes: route.hours * 60,
      place: event?.place ?? "Vanduo Marse",
      blurb: route.description || "Turas su gidu.",
      price: route.price,
      capacity: v.capacity === "" ? null : Number(v.capacity),
      sold: event?.sold ?? 0,
      published: v.published,
      tourRouteId: route.id,
    });
    if ("error" in result) {
      setError("root", { message: result.error.message });
      return;
    }
    toast.success(event ? "Turas atnaujintas" : "Turas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Redaguoti turą" : "Pridėti turą"}</DialogTitle>
          <DialogDescription>Pavadinimas, kaina ir trukmė imami iš turo tipo. Svetainėje turą galima rezervuoti tik paskelbtomis datomis.</DialogDescription>
        </DialogHeader>
        <form id="tour-departure-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="td-route">Turo tipas</Label>
            <Controller
              control={control}
              name="routeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="td-route" className="w-full" aria-invalid={!!err.routeId}>
                    <SelectValue placeholder="Pasirinkite" />
                  </SelectTrigger>
                  <SelectContent>
                    {quadTourRoutes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.price} € / keturračiui · {r.hours} val.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {err.routeId ? <p className="text-xs text-destructive">{err.routeId.message}</p> : null}
            {quadTourRoutes.length === 0 ? <p className="text-xs text-muted-foreground">Turo tipų dar nėra: pridėkite juos šalia, kortelėje „Turų tipai“.</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="td-date">Data</Label>
            <Controller control={control} name="date" render={({ field }) => <DatePicker id="td-date" value={field.value} onChange={field.onChange} invalid={!!err.date} />} />
            {err.date ? <p className="text-xs text-destructive">{err.date.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="td-hour">Pradžia</Label>
            <Controller
              control={control}
              name="hour"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!route}>
                  <SelectTrigger id="td-hour" className="w-full" aria-invalid={!!err.hour}>
                    <SelectValue placeholder={route ? "Pasirinkite" : "Pirma pasirinkite tipą"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}–{hourLabel(h + (route?.hours ?? 1))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {err.hour ? <p className="text-xs text-destructive">{err.hour.message}</p> : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="td-capacity">Keturračių skaičius</Label>
            <Input id="td-capacity" inputMode="numeric" placeholder="Pagal laisvus keturračius" aria-invalid={!!err.capacity} {...register("capacity")} />
            <p className="text-xs text-muted-foreground">Kiek keturračių gali prisijungti prie šio turo. Palikus tuščią, riboja tik laisvi parko keturračiai.</p>
            {err.capacity ? <p className="text-xs text-destructive">{err.capacity.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Paskelbti svetainėje
              </label>
            )}
          />
          {err.root?.message ? (
            <p role="alert" className="text-xs text-destructive sm:col-span-2">
              {err.root.message}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="tour-departure-form" disabled={formState.isSubmitting}>
            {event ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
