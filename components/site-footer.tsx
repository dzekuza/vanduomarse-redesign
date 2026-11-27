import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SectionKicker } from "@/components/section-kicker";
import { StarMark } from "@/components/star-mark";
import { FooterLinks } from "@/components/footer-links";
import { FOOTER_CONTACTS, telHref, type Contact } from "@/lib/contacts";

/** The giant "Susitinkam Marse" closing line. */
export function FooterWord() {
  return (
    <Reveal className="mb-12 md:mb-17.5">
      <p aria-hidden className="group relative text-footer-sm font-bold md:text-footer">
        SUSITINKAM
        <br />
        MARSE
        <StarMark className="ml-2.5 inline-block size-8 align-middle text-rust motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out-strong motion-safe:group-hover:rotate-180 md:size-16 xl:size-24" />
      </p>
    </Reveal>
  );
}

/** Logo on the left, copyright on the far right. */
export function FooterBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-line pt-6.5 text-xs">
      <Image src="/brand/logo-dark.svg" alt="Vanduo Marse" width={134} height={51} className="h-auto w-26 shrink-0 md:w-30" />
      <span>© {new Date().getFullYear()} VANDUO MARSE</span>
    </div>
  );
}

const CONTACT_LINK = "inline-flex min-h-11 text-xs underline underline-offset-4 wrap-anywhere lg:min-h-8 transition-colors duration-150 ease-out-strong hover:text-rust";

/** One contact with its name, email and phone stacked under a hairline. */
function ContactItem({ contact: c }: { contact: Contact }) {
  return (
    <li className="min-w-0 border-t border-line pt-4">
      <p className="text-sm font-bold">{c.name}</p>
      <div className="flex flex-col items-start">
        <a href={`mailto:${c.email}`} className={`${CONTACT_LINK} items-center`}>
          {c.email}
        </a>
        <a href={telHref(c.phone)} className={`${CONTACT_LINK} items-center`}>
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
      <FooterWord />
      <Reveal>
        <SectionKicker left="KONTAKTAI" right="LAUKSIME JŪSŲ" />
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
          {FOOTER_CONTACTS.map((c) => (
            <ContactItem key={c.name} contact={c} />
          ))}
        </ul>
      </Reveal>
      <FooterLinks />
      <FooterBar />
    </footer>
  );
}
