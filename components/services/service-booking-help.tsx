import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { telHref, type Contact } from "@/lib/contacts";

/**
 * Phone and e-mail side by side; they wrap onto two lines only when the box is too narrow for both. Each link keeps a
 * 44 px tap area, but the areas overlap a little (`-my-1.5`) so wrapped lines sit close together.
 */
export function ServiceBookingHelp({ contact }: { contact: Pick<Contact, "phone" | "email"> }) {
  return (
    <section aria-label="Reikalinga pagalba?" className="mt-5 border-t border-line pt-4 text-xs">
      <p className="font-bold">Reikalinga pagalba?</p>
      <div className="flex flex-wrap items-center gap-x-4 py-1.5 text-xs font-normal tracking-normal">
        <a href={telHref(contact.phone)} className="-my-1.5 inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap hover:text-rust">
          <PhoneIcon size={16} aria-hidden className="shrink-0" />
          {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className="-my-1.5 inline-flex min-h-11 min-w-0 items-center gap-2 hover:text-rust">
          <EnvelopeSimpleIcon size={16} aria-hidden className="shrink-0" />
          <span className="min-w-0 wrap-anywhere">{contact.email}</span>
        </a>
      </div>
    </section>
  );
}
