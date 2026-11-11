import { ArrowDownIcon, TrashSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { useId, useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActivityId, PlanLine } from "@/lib/reservation";
import { formatHour } from "@/lib/sauna";
import { ACTIVITY_ICON } from "./activity-icons";
import type { PlanQuantities } from "./plan-quantities";

export interface PlanLinesProps {
  lines: PlanLine[];
  quantities: PlanQuantities;
  saunaTime?: {
    value: number | null;
    starts: number[];
    onChange: (startHour: number) => void;
  };
  busy: boolean;
  onRemove: (id: ActivityId) => void;
}

/** Activity summaries and their inline quantity or start-time editors. */
export function PlanLines({ lines, quantities, saunaTime, busy, onRemove }: PlanLinesProps) {
  const [expanded, setExpanded] = useState<ActivityId | null>(null);
  const id = useId();
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="mb-4 text-micro uppercase text-copy">Dienos planas</p>
      <ol className="relative">
        {lines.map((l, i) => {
          const Icon = ACTIVITY_ICON[l.id];
          const last = i === lines.length - 1;
          const fields = quantities[l.id];
          const time = l.id === "pirtis" ? saunaTime : undefined;
          const editable = Boolean(time || fields?.length);
          const editLabel = time ? "Keisti laiką" : "Keisti kiekį";
          const editing = expanded === l.id;
          const editorId = `${id}-${l.id}`;
          return (
            <li key={l.id} className={`relative pl-11 ${last ? "" : "pb-10"}`}>
              {last ? null : (
                <>
                  <span aria-hidden className="absolute bottom-6 left-4 top-9 w-px bg-ink/30" />
                  <ArrowDownIcon aria-hidden size={16} className="absolute bottom-1 left-2 text-rust" />
                </>
              )}
              <span className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border border-ink">
                <Icon size={16} aria-hidden />
              </span>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-normal">{l.title}</p>
                  <p className="text-copy">{l.detail}</p>
                </div>
                <p className="shrink-0 font-bold">{l.price} €</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-copy">{l.schedule}</p>
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2">
                {editable ? (
                  <button
                    type="button"
                    aria-label={`${editLabel}: ${l.title}`}
                    aria-controls={editorId}
                    aria-expanded={editing}
                    disabled={busy}
                    onClick={() => setExpanded(editing ? null : l.id)}
                    className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 enabled:hover:text-rust-ink disabled:opacity-40"
                  >
                    {editLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Pašalinti iš plano: ${l.title}`}
                  title="Pašalinti iš plano"
                  disabled={busy}
                  onClick={() => {
                    if (editing) setExpanded(null);
                    onRemove(l.id);
                  }}
                  className="ml-auto grid size-11 place-items-center enabled:hover:text-rust-ink disabled:opacity-40"
                >
                  <TrashSimpleIcon aria-hidden size={18} />
                </button>
              </div>
              {editable ? (
                <fieldset id={editorId} hidden={!editing} disabled={busy} className="min-w-0 space-y-3 border-t border-line pt-3">
                  <legend className="sr-only">{l.title}</legend>
                  {editing && time ? (
                    <div className="grid gap-1">
                      <span className="text-micro uppercase text-copy">Pradžios laikas</span>
                      <Select
                        value={time.value !== null && time.starts.includes(time.value) ? String(time.value) : ""}
                        onValueChange={(value) => time.onChange(Number(value))}
                        disabled={busy || time.starts.length === 0}
                      >
                        <SelectTrigger aria-label={`Pradžios laikas: ${l.title}`} className="w-full rounded-none border-line bg-transparent">
                          <SelectValue placeholder="Pasirink laiką" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {time.starts.map((hour) => <SelectItem key={hour} value={String(hour)} className="min-h-11">{formatHour(hour)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {time.starts.length === 0 ? <p role="status" className="text-xs text-rust-ink">Šią dieną laisvų laikų nėra. Pasirink kitą dieną.</p> : null}
                    </div>
                  ) : null}
                  {editing ? fields?.map((field) => (
                    <CompactStepper key={field.id} label={field.label} value={field.value} onChange={field.onChange} min={field.min ?? 1} max={field.max} editable />
                  )) : null}
                </fieldset>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
