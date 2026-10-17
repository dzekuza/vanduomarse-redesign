interface Row {
  label: string;
  note?: string;
  adult: string;
  child: string;
}

const RIDE_ROWS: Row[] = [
  { label: "1 valanda", note: "iki 17:00", adult: "15 €", child: "10 €" },
  { label: "1 valanda", note: "nuo 17:00 ir savaitgaliais", adult: "20 €", child: "14 €" },
  { label: "2 valandos", note: "iki 17:00", adult: "20 €", child: "14 €" },
  { label: "2 valandos", note: "nuo 17:00 ir savaitgaliais", adult: "25 €", child: "17 €" },
  { label: "Visa diena", adult: "35 €", child: "25 €" },
  { label: "Naujokams", note: "su įranga, naujokų valandomis", adult: "15 €", child: "—" },
];

const PASSES: Row[] = [
  { label: "Mėnuo Marse", note: "30 dienų neribotai", adult: "270 €", child: "210 €" },
  { label: "Neribotas", note: "visą sezoną", adult: "750 €", child: "580 €" },
];

function PriceTable({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold text-foam">{title}</h3>
      <div className="mt-4 divide-y divide-line-on-ink">
        {rows.map((r) => (
          <div key={r.label + (r.note ?? "")} className="flex items-baseline justify-between gap-4 py-3">
            <div>
              <p className="text-foam">{r.label}</p>
              {r.note ? <p className="text-xs text-foam/50">{r.note}</p> : null}
            </div>
            <div className="flex shrink-0 items-baseline gap-5 tabular-nums">
              <span className="text-foam">{r.adult}</span>
              <span className="text-foam/50">{r.child}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="kainos" className="bg-ink px-6 py-16 text-foam md:px-10 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-display max-w-md text-4xl font-bold leading-tight md:text-5xl">Kainos</h2>
        <p className="text-sm text-foam/60">
          Suaugę <span className="mx-2 text-foam/30">/</span> Vaikai iki 14 m.
        </p>
      </div>
      <p className="mt-3 max-w-md text-foam/60">Plaukimas vyksta be išankstinės rezervacijos.</p>
      <div className="mt-14 grid gap-14 md:grid-cols-2">
        <PriceTable title="Plaukimas" rows={RIDE_ROWS} />
        <PriceTable title="Abonementai" rows={PASSES} />
      </div>
    </section>
  );
}
