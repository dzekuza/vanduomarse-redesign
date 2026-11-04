import { ArrowDownIcon, TrashSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { SERVICES, type Service } from "@/components/landing/content";
import { PhoneHelp } from "@/components/phone-help";
import type { ActivityId, PlanLine } from "@/lib/reservation";
import { ACTIVITY_ICON } from "./activity-icons";
import type { PlanQuantities } from "./plan-quantities";

export const PLAN_ACTIVITY_PHOTOS: Record<ActivityId, Pick<Service, "photo" | "alt">> = {
  pirtis: SERVICES.sauna,
  nakvyne: SERVICES.cabins,
  keturraciai: SERVICES.ciongo,
};

export interface PlanDetailsProps {
  facts: { label: string; value: string }[];
  lines: PlanLine[];
  total: number;
  quantities: PlanQuantities;
  busy: boolean;
  onRemove: (id: ActivityId) => void;
}

interface PlanPanelProps extends PlanDetailsProps {
  activity: ActivityId;
}

/** Side panel that follows the visitor: photo, "Tavo pasirinkimas" and the running total. */
export function PlanPanel({ activity, ...details }: PlanPanelProps) {
  const { photo, alt } = PLAN_ACTIVITY_PHOTOS[activity];

  return (
    <aside aria-label="Tavo pasirinkimas" className="hidden border border-line bg-foam/15 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto">
      <div className="relative aspect-video max-h-48 w-full bg-dust-soft">
        <Image src={photo} alt={alt} fill sizes="33vw" className="object-cover" />
        <span className="absolute bottom-0 left-4 bg-dust px-3 py-2 text-micro uppercase">Tavo planas Marse</span>
      </div>
      <div className="space-y-6 p-5 sm:p-8">
        <h2 className="text-tile font-bold">Tavo pasirinkimas</h2>
        <PlanDetails {...details} />
      </div>
    </aside>
  );
}

/** The live plan shown in both the desktop panel and the mobile summary sheet. */
export function PlanDetails({ facts, lines, total, quantities, busy, onRemove }: PlanDetailsProps) {
  const [expanded, setExpanded] = useState<ActivityId | null>(null);
  const id = useId();
  const totalRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <dl className="divide-y divide-line text-xs">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-copy">{f.label}</dt>
            <dd className="font-bold">{f.value}</dd>
          </div>
        ))}
      </dl>
      {lines.length ? (
        <div>
          <p className="mb-4 text-micro uppercase text-copy">Dienos planas</p>
          <ol className="relative">
            {lines.map((l, i) => {
              const Icon = ACTIVITY_ICON[l.id];
              const last = i === lines.length - 1;
              const fields = quantities[l.id];
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
                  <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2">
                    {fields?.length ? (
                      <button
                        type="button"
                        aria-label={`Keisti kiekį: ${l.title}`}
                        aria-controls={editorId}
                        aria-expanded={editing}
                        disabled={busy}
                        onClick={() => setExpanded(editing ? null : l.id)}
                        className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 enabled:hover:text-rust-ink disabled:opacity-40"
                      >
                        Keisti kiekį
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Pašalinti iš plano: ${l.title}`}
                      title="Pašalinti iš plano"
                      disabled={busy}
                      onClick={() => {
                        totalRef.current?.focus({ preventScroll: true });
                        if (editing) setExpanded(null);
                        onRemove(l.id);
                      }}
                      className="ml-auto grid size-11 place-items-center enabled:hover:text-rust-ink disabled:opacity-40"
                    >
                      <TrashSimpleIcon aria-hidden size={18} />
                    </button>
                  </div>
                  {fields?.length ? (
                    <fieldset id={editorId} hidden={!editing} disabled={busy} className="min-w-0 space-y-3 border-t border-line pt-3">
                      <legend className="sr-only">{l.title}</legend>
                      {editing ? fields.map((field) => (
                        <Stepper key={field.id} label={field.label} value={field.value} onChange={field.onChange} min={1} max={field.max} editable compact />
                      )) : null}
                    </fieldset>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
      <div className="border-t border-line pt-4">
        <p ref={totalRef} tabIndex={-1} className="text-micro uppercase text-copy">Iš viso, su PVM</p>
        <p aria-live="polite" className="font-display text-total font-bold">{total} €</p>
        <p className="mt-1 text-xs text-copy">Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime.</p>
      </div>
      <PhoneHelp />
    </>
  );
}
