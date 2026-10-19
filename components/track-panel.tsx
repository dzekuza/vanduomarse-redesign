import { CableLoop } from "./cable-loop";

const SPECS = [
  { value: "620", unit: "m", label: "kabelio trasa" },
  { value: "6", label: "bokštai" },
  { value: "17", label: "kliūčių ežere" },
  { value: "8", label: "raiteliai vienu metu" },
] as const;

function TrackSpec({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="flex flex-col-reverse justify-end gap-2 border-t border-line-on-ink pt-4">
      <dt className="text-xs uppercase text-foam/60">{label}</dt>
      <dd className="font-display text-3xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1 text-base text-foam/60">{unit}</span>}
      </dd>
    </div>
  );
}

/** Ink block with the cable loop schematic and the park's numbers: the hero's visual anchor. */
export function TrackPanel({ className }: { className?: string }) {
  return (
    <figure className={`flex flex-col gap-8 bg-ink p-6 text-foam sm:p-8 ${className ?? ""}`}>
      <figcaption className="text-xs uppercase text-foam/60">Trasos schema</figcaption>
      <CableLoop className="mx-auto w-full max-w-md text-foam" />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-2">
        {SPECS.map((s) => (
          <TrackSpec key={s.label} {...s} />
        ))}
      </dl>
    </figure>
  );
}
