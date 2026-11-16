"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { formatAgo } from "@/lib/admin/format";
import type { ExternalCalendar } from "@/lib/admin/types";
import { SIRVOY_FEED_URL } from "@/lib/ical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  url: z.string().trim().regex(SIRVOY_FEED_URL, "Įklijuokite „Sirvoy“ iCal eksporto adresą (secured.sirvoy.com/ical/…)."),
});
type Values = z.infer<typeof schema>;

/** What the room's feed is doing, in one short line. */
function statusLine(calendar: ExternalCalendar): string {
  if (!calendar.active) return "Neprijungta";
  if (calendar.lastError) return `Klaida: ${calendar.lastError}`;
  return calendar.lastSyncedAt ? `Prijungta · atnaujinta ${formatAgo(calendar.lastSyncedAt)}` : "Prijungta · dar neskaityta";
}

/** One Sirvoy room: its feed address field (the stored address is never shown) and its connection status. */
export function SirvoyFeedRow({ calendar, stayLabel }: { calendar: ExternalCalendar; stayLabel: string }) {
  const { saveExternalFeed } = useAdmin();
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { url: "" } });
  const inputId = `sirvoy-feed-${calendar.id}`;

  const save = handleSubmit(async ({ url }) => {
    const result = await saveExternalFeed(calendar.id, url);
    if ("error" in result) return;
    toast.success(`Kambarys ${calendar.label}: adresas išsaugotas`);
    reset({ url: "" });
  });

  const remove = async () => {
    const result = await saveExternalFeed(calendar.id, "");
    if ("data" in result) toast.success(`Kambarys ${calendar.label}: atjungta`);
  };

  return (
    <form onSubmit={save} className="space-y-2 py-3 first:pt-0" noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <label htmlFor={inputId} className="text-sm font-medium">
          Kambarys {calendar.label} <span className="font-normal text-muted-foreground">· {stayLabel}</span>
        </label>
        <p className={`text-xs ${calendar.lastError ? "text-destructive" : "text-muted-foreground"}`}>{statusLine(calendar)}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={calendar.active ? "Įklijuokite naują adresą, jei jis pasikeitė" : "https://secured.sirvoy.com/ical/…"}
          aria-invalid={!!formState.errors.url}
          className="min-h-11 flex-1"
          {...register("url")}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={formState.isSubmitting} className="min-h-11 flex-1 sm:flex-none">
            Išsaugoti
          </Button>
          {calendar.active ? (
            <Button type="button" variant="outline" onClick={remove} className="min-h-11 flex-1 sm:flex-none">
              Atjungti
            </Button>
          ) : null}
        </div>
      </div>
      {formState.errors.url ? <p className="text-xs text-destructive">{formState.errors.url.message}</p> : null}
    </form>
  );
}
