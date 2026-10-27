import { EnvelopeSimpleIcon, MapPinIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";

const LINK = "flex min-h-11 items-center gap-2 transition-colors hover:text-rust";

/** Thin strip above the site header: phone, email and the map link. Scrolls away; the header stays sticky. */
export function ContactBar() {
  return (
    <div className="flex items-center justify-between gap-4 bg-dust px-6 text-xs md:px-10">
      <div className="flex items-center gap-5">
        <a href={telHref(MAIN_CONTACT.phone)} className={LINK}>
          <PhoneIcon size={16} aria-hidden />
          {MAIN_CONTACT.phone}
        </a>
        <a href={`mailto:${MAIN_CONTACT.email}`} className={LINK} aria-label={MAIN_CONTACT.email}>
          <EnvelopeSimpleIcon size={16} aria-hidden />
          <span className="hidden sm:inline">{MAIN_CONTACT.email}</span>
        </a>
      </div>
      <a href={MAPS_URL} target="_blank" rel="noreferrer" className={LINK}>
        <MapPinIcon size={16} aria-hidden />
        <span className="hidden md:inline">Ežero krantas, Lietuva</span>
        <span className="md:hidden">Žemėlapis</span>
      </a>
    </div>
  );
}
