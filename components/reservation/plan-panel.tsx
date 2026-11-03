import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { PhoneHelp } from "@/components/phone-help";
import type { PlanLine } from "@/lib/reservation";
import { ACTIVITY_ICON } from "./activity-icons";

interface PlanPanelProps {
  photo: { src: string; alt: string };
  /** Date, time and group once step 1 is done. */
  facts: { label: string; value: string }[];
  lines: PlanLine[];
  total: number;
}

/** Side panel that follows the visitor: photo, "Tavo pasirinkimas" and the running total. */
export function PlanPanel({ photo, facts, lines, total }: PlanPanelProps) {
  return (
    <aside aria-label="Tavo pasirinkimas" className="border border-line bg-foam/15 lg:sticky lg:top-32 lg:self-start">
      <div className="relative aspect-4/3 bg-dust-soft">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        <span className="absolute bottom-0 left-4 bg-dust px-3 py-2 text-micro uppercase">Tavo planas Marse</span>
      </div>
      <div className="space-y-6 p-5 sm:p-8">
        <h2 className="text-tile font-bold">Tavo pasirinkimas</h2>
        <dl className="divide-y divide-line text-xs">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-ink/70">{f.label}</dt>
              <dd className="font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>
        {lines.length ? (
          <div>
            <p className="mb-4 text-micro uppercase text-ink/70">Dienos planas</p>
            <ol className="relative">
              {lines.map((l, i) => {
                const Icon = ACTIVITY_ICON[l.id];
                const last = i === lines.length - 1;
                return (
                  <li key={l.id} className={`relative pl-12 ${last ? "" : "pb-10"}`}>
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
                        <p className="text-ink/60">{l.detail}</p>
                      </div>
                      <p className="shrink-0 font-bold">{l.price} €</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
        <div className="border-t border-line pt-4">
          <p className="text-micro uppercase text-ink/70">Iš viso, su PVM</p>
          <p className="font-display text-total font-bold">{total} €</p>
          <p className="mt-1 text-xs text-ink/60">Preliminari kaina. Galutinę ir laisvas vietas patvirtinsime.</p>
        </div>
        <PhoneHelp />
      </div>
    </aside>
  );
}
