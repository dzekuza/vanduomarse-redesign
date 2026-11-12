import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { telHref, type Contact } from "@/lib/contacts";
import { cn } from "@/lib/utils";

export function ServiceBookingHelp({ contact, stacked }: {
  contact: Pick<Contact, "phone" | "email">;
  stacked?: boolean;
}) {
  return (
    <section aria-label="Reikalinga pagalba?" className="@container/booking-help mt-5 border-t border-line pt-4 text-xs">
      <p className="font-bold">Reikalinga pagalba?</p>
      <div className={cn("flex flex-col items-start text-micro font-normal tracking-normal @xs/booking-help:text-xs", !stacked && "@sm/booking-help:flex-row @sm/booking-help:flex-wrap @sm/booking-help:items-center @sm/booking-help:gap-x-3")}>
        <a href={telHref(contact.phone)} className={cn("inline-flex min-h-11 shrink-0 items-end gap-2 whitespace-nowrap pb-1 hover:text-rust", !stacked && "@sm/booking-help:items-center @sm/booking-help:pb-0")}>
          <PhoneIcon size={16} aria-hidden className="shrink-0" />
          {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className={cn("inline-flex min-h-11 min-w-0 items-start gap-2 pt-1 hover:text-rust", !stacked && "@sm/booking-help:items-center @sm/booking-help:pt-0")}>
          <EnvelopeSimpleIcon size={16} aria-hidden className="shrink-0" />
          <span className="min-w-0 wrap-anywhere">{contact.email}</span>
        </a>
      </div>
    </section>
  );
}
