import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";
import { StarMark } from "@/components/star-mark";
import { CONTACTS, MAIN_CONTACT, telHref } from "@/lib/contacts";

const INSTAGRAM_URL = "https://www.instagram.com/vanduo_marse/";
const LINK = "inline-flex min-h-11 items-center";

/** The giant "Susitinkam Marse" closing line. */
export function FooterWord() {
  return (
    <Reveal className="my-12 md:my-17.5">
      <p aria-hidden className="relative text-footer-sm font-bold md:text-footer">
        SUSITINKAM
        <br />
        MARSE
        <StarMark className="ml-2.5 inline-block size-8 align-middle text-rust md:size-16 xl:size-24" />
      </p>
    </Reveal>
  );
}

/** Logo, link row and copyright. `topHref` is where "Į viršų" jumps to. */
export function FooterBar({ topHref }: { topHref: string }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-9 border-t border-line pt-6.5 text-xs md:flex">
      <Image src="/brand/logo-dark.svg" alt="Vanduo Marse" width={134} height={51} className="h-auto w-26 md:w-30" />
      <a href={`mailto:${MAIN_CONTACT.email}`} className={LINK}>
        {MAIN_CONTACT.email} ↗
      </a>
      <Link href="/kuponai" className={LINK}>
        Dovanoti Marsą ↗
      </Link>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className={LINK}>
        Instagram ↗
      </a>
      <a href={topHref} className={LINK}>
        Į viršų ↑
      </a>
      <span className="col-span-2 md:ml-auto">© {new Date().getFullYear()} VANDUO MARSE</span>
    </div>
  );
}

/** Footer of the inner pages: every contact, the closing line and the link row. */
export function SiteFooter() {
  return (
    <footer className="bg-dust px-gutter pt-14 pb-6.5 md:pt-19">
      <Reveal>
        <SectionKicker left="KONTAKTAI" right="VISI MARSO SEKTORIAI" />
        <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACTS.map((c) => (
            <li key={c.name}>
              <p className="text-sm font-bold">
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener" className="hover:text-rust">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
              </p>
              <a href={`mailto:${c.email}`} className={`${LINK} text-xs`}>
                {c.email}
              </a>
              <br />
              <a href={telHref(c.phone)} className={`${LINK} text-xs`}>
                {c.phone}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
      <FooterWord />
      <FooterBar topHref="#" />
    </footer>
  );
}
