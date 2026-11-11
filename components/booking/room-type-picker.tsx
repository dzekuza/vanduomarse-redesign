"use client";

import { STAY_KIND_LABEL, lowestStayPrice, stayTypesOf, type StayKind, type StayType } from "@/lib/cabin";

/** Cabin or camper pitch: one button per kind that has at least one active type. */
export function RoomTypePicker({ types, selected, onSelect }: { types: StayType[]; selected: StayKind; onSelect: (kind: StayKind) => void }) {
  const kinds = (["namelis", "kemperis"] as const).filter((kind) => stayTypesOf(types, kind).length > 0);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {kinds.map((kind) => {
        const active = selected === kind;
        const ofKind = stayTypesOf(types, kind);
        const note = ofKind.length === 1 ? ofKind[0].note : `${ofKind.length} tipai`;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onSelect(kind)}
            aria-pressed={active}
            className={`flex items-center justify-between border px-4 py-4 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-98 ${
              active ? "border-ink bg-ink text-foam" : "border-ink text-ink hover:border-rust"
            }`}
          >
            <div>
              <p className="font-normal">{STAY_KIND_LABEL[kind]}</p>
              <p className={active ? "text-foam/70" : "text-ink/50"}>{note}</p>
            </div>
            <p className="font-display text-figure font-bold">
              {ofKind.length > 1 && <span className="font-sans text-sm font-normal normal-case">nuo </span>}
              {lowestStayPrice(types, kind)} €
            </p>
          </button>
        );
      })}
    </div>
  );
}
