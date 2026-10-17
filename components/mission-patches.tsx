import Link from "next/link";

interface Patch {
  name: string;
  tag: string;
  blurb: string;
  color: string;
  href?: string;
  icon: React.ReactNode;
}

const PATCHES: Patch[] = [
  {
    name: "Vanduo Marse",
    tag: "Kabelio trasa",
    blurb: "620 m trasa, 17 kliūčių, 8 raiteliai vienu metu.",
    color: "var(--lake)",
    icon: (
      <path d="M4 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    ),
  },
  {
    name: "Marso Akademija",
    tag: "Pamokos",
    blurb: "Nuo pirmo karšto kabelio iki PRO figūrų.",
    color: "var(--rust)",
    icon: <path d="M12 5l7 3-7 3-7-3 7-3zM5 10v4l7 3 7-3v-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />,
  },
  {
    name: "Pirtis Marse",
    tag: "Nauja",
    blurb: "Pirtis prie ežero — atvėsk vandenyje, sušildyk garuose.",
    color: "var(--signal)",
    href: "/pirtis",
    icon: (
      <path
        d="M8 16c-1-2 1-3 0-5s1-3 0-5M12 16c-1-2 1-3 0-5s1-3 0-5M16 16c-1-2 1-3 0-5s1-3 0-5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  {
    name: "Miegas Marse",
    tag: "Nakvynė",
    blurb: "Namelis ar kemperio aikštelė prie trasos.",
    color: "var(--ink)",
    icon: <path d="M5 13a7 7 0 0010-10 7 7 0 107 7 7 7 0 01-10 10 7 7 0 01-7-7z" stroke="currentColor" strokeWidth="1.3" fill="none" />,
  },
  {
    name: "Skoniai Marse",
    tag: "Restoranas",
    blurb: "Valgis su vaizdu į trasą, visą dieną.",
    color: "var(--rust-soft)",
    icon: <path d="M8 4v7a2 2 0 002 2M6 4v6M8 4v6M16 4v16M16 4a3 3 0 00-3 3v4h3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />,
  },
  {
    name: "Renginiai Marse",
    tag: "Šventės",
    blurb: "Gimtadieniai, komandų dienos, varžybos.",
    color: "var(--lake-soft)",
    icon: <path d="M5 20l3-7 9-9 3 3-9 9-7 3zM14 7l3 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

function PatchCard({ patch }: { patch: Patch }) {
  const content = (
    <div className="group flex flex-col items-center text-center">
      <div
        className="flex size-32 items-center justify-center rounded-full border-2 border-dashed transition-transform group-hover:scale-105 md:size-36"
        style={{ borderColor: patch.color, color: patch.color }}
      >
        <svg viewBox="0 0 24 24" className="size-12">
          {patch.icon}
        </svg>
      </div>
      <p className="mt-4 text-xs font-medium tracking-wide" style={{ color: patch.color }}>
        {patch.tag}
      </p>
      <h3 className="font-display mt-1 text-xl font-bold">{patch.name}</h3>
      <p className="mt-2 max-w-[18ch] text-sm text-ink/70">{patch.blurb}</p>
    </div>
  );

  return patch.href ? (
    <Link href={patch.href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function MissionPatches() {
  return (
    <section id="zonos" className="px-6 py-16 md:px-10 md:py-24">
      <h2 className="font-display max-w-md text-4xl font-bold leading-tight md:text-5xl">Šeši Marso sektoriai</h2>
      <p className="mt-3 max-w-md text-ink/70">Vienas bilietas, visa diena. Kiekvienas sektorius veikia savo laiku.</p>
      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3">
        {PATCHES.map((p) => (
          <PatchCard key={p.name} patch={p} />
        ))}
      </div>
    </section>
  );
}
