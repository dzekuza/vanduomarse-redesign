const HOURS = [
  { season: "Gegužė–Rugpjūtis", weekday: "I–V 8:00–21:00", weekend: "VI–VII 9:00–21:00" },
  { season: "Rugsėjis", weekday: "I–V 16:00–19:00", weekend: "VI–VII 12:00–19:00" },
];

export function StatusBar() {
  return (
    <section className="border-y border-line bg-ink px-6 py-6 text-foam md:px-10">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-signal" />
          </span>
          <span className="text-sm font-medium">Trasa veikia šiandien</span>
        </div>
        {HOURS.map((h) => (
          <div key={h.season} className="text-sm text-foam/70">
            <span className="text-foam">{h.season}:</span> {h.weekday}, {h.weekend}
          </div>
        ))}
      </div>
    </section>
  );
}
