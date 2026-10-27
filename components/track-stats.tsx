const SPECS = [
  { value: "620", unit: "m", label: "kabelio trasa" },
  { value: "6", label: "bokštai" },
  { value: "17", label: "kliūčių ežere" },
  { value: "8", label: "raiteliai vienu metu" },
] as const;

/** The park's numbers as oversized coral figures: the page's counterpoint to the wordmark. */
export function TrackStats() {
  return (
    <section aria-label="Trasos skaičiai" className="px-6 pb-16 md:px-10 md:pb-24">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        {SPECS.map((s) => (
          <div key={s.label} className="flex flex-col-reverse justify-end gap-3">
            <dt className="text-xs uppercase">{s.label}</dt>
            <dd className="font-wordmark text-7xl text-rust md:text-8xl xl:text-9xl">
              {s.value}
              {"unit" in s && <span className="ml-1 text-3xl md:text-4xl xl:text-5xl">{s.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
