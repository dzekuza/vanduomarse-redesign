interface Item {
  label: string;
  note?: string;
  price: string;
}

const GEAR: Item[] = [
  { label: "Hidrokostiumas", note: "2 val.", price: "5 €" },
  { label: "Hidrokostiumas", note: "visa diena", price: "10 €" },
  { label: "Vandenlentė", note: "2 val.", price: "5 €" },
  { label: "Vandenlentė", note: "visa diena", price: "10 €" },
  { label: "Šalmas, liemenė", price: "Nemokamai" },
  { label: "Asmeninė saugykla", note: "sezonui", price: "100 €" },
];

const EXTRAS: Item[] = [
  { label: "Tinklinio aikštelė", note: "valanda", price: "10 €" },
  { label: "Gultai ir baseinas", note: "suaugusiems", price: "10 €" },
  { label: "Gultai ir baseinas", note: "vaikams", price: "5 €" },
  { label: "Plaukimo reikmenys", note: "nuoma vaikams, užstatas", price: "10 €" },
  { label: "Rankšluostis", price: "5 €" },
  { label: "Apyrankė", note: "naujokams, vienkartinė", price: "5 €" },
];

function Tile({ item }: { item: Item }) {
  return (
    <div className="border border-ink/15 px-4 py-3">
      <p className="text-sm">{item.label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        {item.note ? <span className="text-xs text-ink/50">{item.note}</span> : <span />}
        <span className="font-display text-lg font-bold">{item.price}</span>
      </div>
    </div>
  );
}

export function Equipment() {
  return (
    <section className="px-6 py-16 md:px-10 md:py-24">
      <h2 className="font-display max-w-md text-4xl font-bold leading-tight md:text-5xl">Įranga ir papildomai</h2>
      <p className="mt-3 max-w-md text-ink/70">Nuomai vietoje, jei savo įrangos neturi.</p>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-ink/60">Įranga</p>
          <div className="grid grid-cols-2 gap-2">
            {GEAR.map((item, i) => (
              <Tile key={item.label + (item.note ?? i)} item={item} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-ink/60">Papildomai</p>
          <div className="grid grid-cols-2 gap-2">
            {EXTRAS.map((item, i) => (
              <Tile key={item.label + (item.note ?? i)} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
