import { ArrowUpRightIcon, EnvelopeSimpleIcon, IdentificationCardIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { telHref, type Contact } from "@/lib/contacts";

export function QuadServiceHelp({ contact }: { contact: Pick<Contact, "phone" | "email"> }) {
  const email = `mailto:${contact.email}`;

  return (
    <div className="mt-5 divide-y divide-line border-t border-line text-xs">
      <p className="flex items-start gap-3 py-4 text-copy">
        <IdentificationCardIcon size={18} aria-hidden className="shrink-0" />
        <span>Atvykdamas turėk asmens tapatybės dokumentą.</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-2">
        <span>Kyla klausimų?</span>
        <a href={`${email}?subject=${encodeURIComponent("Keturračių turo užklausa")}`} className="inline-flex min-h-11 items-center gap-2 font-bold hover:text-rust">
          Nemokama užklausa
          <ArrowUpRightIcon size={16} aria-hidden className="shrink-0" />
        </a>
      </div>
      <section aria-labelledby="quad-service-help-title" className="pt-4">
        <h3 id="quad-service-help-title" className="font-bold">Reikalinga pagalba?</h3>
        <a href={telHref(contact.phone)} className="flex min-h-11 items-center gap-3 hover:text-rust">
          <PhoneIcon size={18} aria-hidden className="shrink-0" />
          {contact.phone}
        </a>
        <a href={email} className="flex min-h-11 items-center gap-3 hover:text-rust">
          <EnvelopeSimpleIcon size={18} aria-hidden className="shrink-0" />
          <span className="min-w-0 wrap-anywhere">{contact.email}</span>
        </a>
      </section>
    </div>
  );
}
