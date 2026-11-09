import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";
import { StarMark } from "@/components/star-mark";
import { CONTACTS, MAIN_CONTACT, telHref, type Contact } from "@/lib/contacts";

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
        {MAIN_CONTACT.email}
      </a>
      <Link href="/kuponai" className={LINK}>
        Dovanoti Marsą
      </Link>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className={LINK}>
        Instagram
      </a>
      <a href={topHref} className={LINK}>
        Į viršų ↑
      </a>
      <span className="col-span-2 md:ml-auto">© {new Date().getFullYear()} VANDUO MARSE</span>
    </div>
  );
}

const CONTACT_LINK = "inline-flex min-h-11 text-xs transition-colors duration-150 ease-out-strong hover:text-rust";

/** One contact with its name, email and phone stacked under a hairline. */
function ContactItem({ contact: c, title = c.name }: { contact: Contact; title?: string }) {
  return (
    <li className="border-t border-line pt-4">
      <p className="text-sm font-bold">{title}</p>
      <div className="flex flex-col items-start">
        <a href={`mailto:${c.email}`} className={`${CONTACT_LINK} items-end pb-1`}>
          {c.email}
        </a>
        <a href={telHref(c.phone)} className={`${CONTACT_LINK} items-start pt-1`}>
          {c.phone}
        </a>
      </div>
    </li>
  );
}

/** Footer of the inner pages: every contact, the closing line and the link row. */
export function SiteFooter() {
  return (
    <footer className="bg-dust px-gutter pt-14 pb-6.5 md:pt-19">
      <Reveal>
        <SectionKicker left="KONTAKTAI" right="VISI MARSO SEKTORIAI" />
        <ul className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACTS.map((c) => (
            <ContactItem key={c.name} contact={c} title={c === MAIN_CONTACT ? "Vanduo Marse ir renginiai" : undefined} />
          ))}
        </ul>
      </Reveal>
      <FooterWord />
      <FooterBar topHref="#" />
    </footer>
  );
}
