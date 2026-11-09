"use client";

import { Controller, type Control } from "react-hook-form";
import { useAdmin } from "../admin-store";
import type { SaunaValues } from "./sauna-schema";
import { UPSELL_UNIT_LABEL } from "@/lib/sauna-upsells";
import { Switch } from "@/components/ui/switch";

/** Which extras from the shared catalogue this sauna offers. */
export function SaunaUpsellsField({ control }: { control: Control<SaunaValues> }) {
  const { upsells } = useAdmin();
  if (!upsells.length) return <p className="text-sm text-muted-foreground">Papildomų paslaugų dar nėra: sukurkite jas žemiau, sąraše „Papildomos paslaugos“.</p>;

  return (
    <Controller
      control={control}
      name="upsellIds"
      render={({ field }) => (
        <ul className="divide-y">
          {upsells.map((u) => {
            const on = field.value.includes(u.id);
            return (
              <li key={u.id}>
                <label className="flex min-h-11 items-center gap-3 py-2">
                  <Switch
                    checked={on}
                    onCheckedChange={(v) => field.onChange(v ? [...field.value, u.id] : field.value.filter((id) => id !== u.id))}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${u.active ? "" : "text-muted-foreground"}`}>
                      {u.name}
                      {u.active ? null : " (paslėpta)"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{u.description}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm tabular-nums">
                    {u.price} €<span className="block text-xs text-muted-foreground">{UPSELL_UNIT_LABEL[u.unit]}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    />
  );
}
