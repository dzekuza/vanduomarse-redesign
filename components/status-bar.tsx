const HOURS = [
  {
    season: "Gegužė-Rugpjūtis",
    slots: [
      { days: "I-V", time: "8:00-21:00" },
      { days: "VI-VII", time: "9:00-21:00" },
    ],
  },
  {
    season: "Rugsėjis",
    slots: [
      { days: "I-V", time: "16:00-19:00" },
      { days: "VI-VII", time: "12:00-19:00" },
    ],
  },
];

/** Park status and season hours: status leads (half the width from `lg`), each season is a labelled day/time list. */
export function StatusBar() {
  return (
    <section className="px-6 pb-16 md:px-10 md:pb-24">
      <div className="grid gap-8 rounded-tile bg-card p-6 md:grid-cols-2 md:p-10 lg:grid-cols-4 lg:items-end">
        <div className="flex items-center gap-3 md:col-span-2">
          <span className="relative flex size-3 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-3 rounded-full bg-signal" />
          </span>
          <p className="font-display text-xl font-bold md:text-3xl">Trasa veikia šiandien</p>
        </div>
        {HOURS.map((h) => (
          <div key={h.season}>
            <h3 className="text-xs uppercase text-ink/70">{h.season}</h3>
            <dl className="mt-3 max-w-60 space-y-1 text-sm tabular-nums">
              {h.slots.map((s) => (
                <div key={s.days} className="flex justify-between gap-6">
                  <dt className="text-ink/70">{s.days}</dt>
                  <dd>{s.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
