import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Sector {
  name: string;
  tag: string;
  blurb: string;
  /** Placeholder photo until real park photography is supplied. */
  image: string;
  href?: string;
  /** In-page anchor (/#id) for sectors without a page of their own. */
  id?: string;
  /** Spans both columns from `md`. */
  wide?: boolean;
  /** Above the fold: it is the page's LCP image, so load it immediately. */
  eager?: boolean;
}

const unsplash = (photo: string) => `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1600&q=75`;

const SECTORS: Sector[] = [
  {
    name: "Vanduo Marse",
    tag: "Kabelio trasa",
    blurb: "620 m trasa, 17 kliūčių, 8 raiteliai vienu metu.",
    image: unsplash("1663226808058-23c9933bd62f"),
    wide: true,
    eager: true,
  },
  {
    name: "Marso Akademija",
    tag: "Pamokos",
    blurb: "Nuo pirmo karšto kabelio iki PRO figūrų.",
    image: unsplash("1531001602318-1916852b9205"),
    id: "akademija",
  },
  {
    name: "Pirtis Marse",
    tag: "Nauja",
    blurb: "Pirtis prie ežero. Atvėsk vandenyje, sušildyk garuose.",
    image: unsplash("1678988227223-45112511eca2"),
    href: "/pirtis",
  },
  {
    name: "Miegas Marse",
    tag: "Nakvynė",
    blurb: "Namelis ar kemperio aikštelė prie trasos.",
    image: unsplash("1504280390367-361c6d9f38f4"),
    href: "/miegas",
  },
  {
    name: "Skoniai Marse",
    tag: "Restoranas",
    blurb: "Valgis su vaizdu į trasą, visą dieną.",
    image: unsplash("1414235077428-338989a2e8c0"),
    id: "skoniai",
  },
  {
    name: "Renginiai Marse",
    tag: "Šventės",
    blurb: "Gimtadieniai, komandų dienos, varžybos.",
    image: unsplash("1758523981365-2bdbacf0ef8b"),
    href: "/renginiai",
    wide: true,
  },
];

function SectorTile({ sector }: { sector: Sector }) {
  const className = cn(
    "group relative isolate block overflow-hidden rounded-tile bg-ink",
    sector.wide ? "aspect-4/3 md:col-span-2 md:aspect-2/1" : "aspect-4/5 md:aspect-square",
  );

  const content = (
    <>
      <Image
        src={sector.image}
        alt=""
        fill
        loading={sector.eager ? "eager" : undefined}
        fetchPriority={sector.eager ? "high" : undefined}
        sizes={sector.wide ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 text-foam md:p-8">
        <span className="w-fit rounded-full bg-foam/20 px-3 py-1 text-xs uppercase backdrop-blur-md">{sector.tag}</span>
        <h3 className="font-display text-xl font-bold md:text-3xl">{sector.name}</h3>
        <p className="max-w-[32ch] text-sm text-foam/90">{sector.blurb}</p>
      </div>
    </>
  );

  return sector.href ? (
    <Link href={sector.href} className={className}>
      {content}
    </Link>
  ) : (
    <div id={sector.id} className={className}>
      {content}
    </div>
  );
}

export function SectorTiles() {
  return (
    <section id="zonos" className="px-6 pb-16 md:px-10 md:pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <h2 className="font-display max-w-xl text-3xl font-bold leading-tight md:text-4xl">Šeši Marso sektoriai</h2>
        <p className="max-w-xs text-xs uppercase md:text-right">Vienas bilietas, visa diena. Kiekvienas sektorius veikia savo laiku.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {SECTORS.map((s) => (
          <SectorTile key={s.name} sector={s} />
        ))}
      </div>
    </section>
  );
}
