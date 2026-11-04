import { PlusIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { TextCtaArrow, textCtaClass } from "@/components/cta";
import { SectionKicker } from "@/components/section-kicker";

interface TeamProfile {
  id: string;
  role: string;
  description: string;
  name?: string;
  portrait?: string;
  link?: { href: string; label: string };
}

const PROFILES: TeamProfile[] = [
  {
    id: "pirtis",
    role: "Pirtininkas / Pirtininkė",
    description: "Veda pirties seansus, supažindina su vanojimu ir parodo, kaip atsivėsinti tarp garo ratų.",
    link: { href: "/rezervacija?veikla=pirtis", label: "Pirties seansų rezervacija" },
  },
  {
    id: "vandenlentes",
    role: "Vandenlenčių parko vadovas",
    description: "Rūpinasi vandenlenčių parko veikla ir svečių patirtimi ant vandens.",
  },
  {
    id: "marketingas",
    role: "Marketingo vadovas",
    description: "Rūpinasi Marso komunikacija ir padeda svečiams atrasti parko veiklas.",
  },
];

const FRAME_CORNERS = [
  "-top-2.5 -left-2.5",
  "-top-2.5 -right-2.5",
  "-bottom-2.5 -left-2.5",
  "-bottom-2.5 -right-2.5",
] as const;

export function TeamSection() {
  return (
    <section id="komanda" aria-labelledby="team-title" className="bg-ink px-gutter py-14 text-dust md:py-19">
      <div className="mx-auto max-w-110 lg:max-w-none">
        <SectionKicker left="VANDUO MARSE" />
        <h2 id="team-title" className="mt-3 text-display font-bold uppercase">Komanda</h2>

        <ul role="list" className="mt-8 grid gap-6 lg:grid-cols-3">
          {PROFILES.map((profile) => (
            <li key={profile.id} className="relative flex min-h-100 min-w-0 flex-col gap-5 border border-dotted border-dust/60 p-5 md:p-6 lg:row-span-3 lg:grid lg:grid-rows-subgrid">
              <div>
                <h3 className="text-figure font-bold">{profile.name ?? profile.role}</h3>
                {profile.name ? <p className="mt-1 text-sm text-dust/80">{profile.role}</p> : null}
              </div>

              <div aria-hidden className="relative grid min-h-40 grow place-items-center bg-dust/5 lg:min-h-52">
                {profile.portrait ? (
                  <Image
                    src={profile.portrait}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 500px) 400px, 85vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <UserIcon weight="thin" className="size-20 text-dust/45" />
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{profile.description}</p>
                {profile.link ? (
                  <Link href={profile.link.href} className={textCtaClass("gap-3")}>
                    {profile.link.label}
                    <TextCtaArrow />
                  </Link>
                ) : null}
              </div>

              {FRAME_CORNERS.map((corner) => (
                <PlusIcon key={corner} aria-hidden weight="thin" className={`pointer-events-none absolute size-5 bg-ink text-dust ${corner}`} />
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
