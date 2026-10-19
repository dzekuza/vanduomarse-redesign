import type { Icon } from "@phosphor-icons/react";
import {
  ConfettiIcon,
  FireIcon,
  ForkKnifeIcon,
  GraduationCapIcon,
  TentIcon,
  WavesIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface Patch {
  name: string;
  tag: string;
  blurb: string;
  color: string;
  href?: string;
  /** In-page anchor (/#id) for sections without a page of their own. */
  id?: string;
  icon: Icon;
}

const PATCHES: Patch[] = [
  {
    name: "Vanduo Marse",
    tag: "Kabelio trasa",
    blurb: "620 m trasa, 17 kliūčių, 8 raiteliai vienu metu.",
    color: "var(--lake)",
    icon: WavesIcon,
  },
  {
    name: "Marso Akademija",
    tag: "Pamokos",
    blurb: "Nuo pirmo karšto kabelio iki PRO figūrų.",
    color: "var(--rust)",
    id: "akademija",
    icon: GraduationCapIcon,
  },
  {
    name: "Pirtis Marse",
    tag: "Nauja",
    blurb: "Pirtis prie ežero. Atvėsk vandenyje, sušildyk garuose.",
    color: "var(--signal)",
    href: "/pirtis",
    icon: FireIcon,
  },
  {
    name: "Miegas Marse",
    tag: "Nakvynė",
    blurb: "Namelis ar kemperio aikštelė prie trasos.",
    color: "var(--ink)",
    href: "/miegas",
    icon: TentIcon,
  },
  {
    name: "Skoniai Marse",
    tag: "Restoranas",
    blurb: "Valgis su vaizdu į trasą, visą dieną.",
    color: "var(--rust-soft)",
    id: "skoniai",
    icon: ForkKnifeIcon,
  },
  {
    name: "Renginiai Marse",
    tag: "Šventės",
    blurb: "Gimtadieniai, komandų dienos, varžybos.",
    color: "var(--lake-soft)",
    href: "/renginiai",
    icon: ConfettiIcon,
  },
];

function PatchCard({ patch }: { patch: Patch }) {
  const Icon = patch.icon;
  const content = (
    <div id={patch.id} className="group flex flex-col items-center text-center">
      <div
        className="flex size-32 items-center justify-center rounded-full border-2 border-dashed transition-transform group-hover:scale-105 md:size-36"
        style={{ borderColor: patch.color, color: patch.color }}
      >
        <Icon size={44} weight="regular" />
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
    <section id="zonos" className="bg-card px-6 py-16 md:px-10 md:py-24">
      <h2 className="font-display max-w-xl text-3xl font-bold leading-tight md:text-4xl">Šeši Marso sektoriai</h2>
      <p className="mt-3 max-w-md text-ink/70">Vienas bilietas, visa diena. Kiekvienas sektorius veikia savo laiku.</p>
      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3">
        {PATCHES.map((p) => (
          <PatchCard key={p.name} patch={p} />
        ))}
      </div>
    </section>
  );
}
