import { ClockCounterClockwiseIcon, EnvelopeSimpleIcon, IdentificationCardIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { telHref, type Contact } from "@/lib/contacts";

export function QuadServiceNotices() {
  return (
    <ul className="space-y-2 border-t border-line pt-4 text-xs text-copy">
      <li className="flex items-start gap-3">
        <ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" />
        <span>Nemokamas atšaukimas likus bent 48 val. iki turo.</span>
      </li>
      <li className="flex items-start gap-3">
        <IdentificationCardIcon size={18} aria-hidden className="shrink-0" />
        <span>Atvykdamas turėk asmens tapatybės dokumentą.</span>
      </li>
    </ul>
  );
}

export function QuadServiceHelp({ contact }: { contact: Pick<Contact, "phone" | "email"> }) {
  return (
    <section aria-labelledby="quad-service-help-title" className="@container/quad-help mt-5 border-t border-line pt-4 text-xs">
      <h3 id="quad-service-help-title" className="font-bold">Reikalinga pagalba?</h3>
      <div className="flex items-center gap-x-3 text-micro tracking-normal @xs/quad-help:text-xs">
        <a href={telHref(contact.phone)} className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap hover:text-rust">
          <PhoneIcon size={16} aria-hidden className="hidden shrink-0 @sm/quad-help:block" />
          {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 min-w-0 items-center gap-2 hover:text-rust">
          <EnvelopeSimpleIcon size={16} aria-hidden className="hidden shrink-0 @sm/quad-help:block" />
          <span className="min-w-0 wrap-anywhere">{contact.email}</span>
        </a>
      </div>
    </section>
  );
}
