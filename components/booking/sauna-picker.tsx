"use client";

import { FireIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { fromRate, type Sauna } from "@/lib/sauna";

interface SaunaPickerProps {
  saunas: Sauna[];
  selected: string;
  onSelect: (id: string) => void;
}

/** First step of private hire: one card per sauna with its cover photo, features and lowest rate. */
export function SaunaPicker({ saunas, selected, onSelect }: SaunaPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {saunas.map((sauna) => (
        <SaunaCard key={sauna.id} sauna={sauna} active={sauna.id === selected} onSelect={() => onSelect(sauna.id)} />
      ))}
    </div>
  );
}

function SaunaCard({ sauna, active, onSelect }: { sauna: Sauna; active: boolean; onSelect: () => void }) {
  const cover = sauna.photos[0];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col border text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 ${
        active ? "border-ink bg-ink text-foam" : "border-ink text-ink hover:border-rust"
      }`}
    >
      <span className="relative block aspect-4/3 w-full sm:aspect-video overflow-hidden bg-dust-soft">
        {cover ? (
          <Image src={cover.url} alt={sauna.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-ink/30">
            <FireIcon size={40} />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-display text-figure font-bold uppercase">{sauna.name}</span>
          <span className="shrink-0 text-sm">
            nuo <span className="font-display text-figure font-bold">{fromRate(sauna.rates)} €</span>/val.
          </span>
        </span>
        {sauna.description ? <span className={`text-sm ${active ? "text-foam/70" : "text-ink/60"}`}>{sauna.description}</span> : null}
        {sauna.features.length ? (
          <span className="flex flex-wrap gap-1.5">
            {sauna.features.map((f) => (
              <span key={f} className={`border px-2 py-0.5 text-xs ${active ? "border-line-on-ink" : "border-line"}`}>
                {f}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}
