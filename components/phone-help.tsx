import { MAIN_CONTACT, telHref } from "@/lib/contacts";
import { Eyebrow } from "./eyebrow";

/** "Easier to talk?" row with the main phone number, at the bottom of a booking side panel. */
export function PhoneHelp() {
  return (
    <a href={telHref(MAIN_CONTACT.phone)} className="flex min-h-11 items-center justify-between gap-4 border-t border-line pt-4 text-xs hover:text-rust">
      <span>
        <Eyebrow as="span" className="block">
          Lengviau pasikalbėti?
        </Eyebrow>
        <span className="block text-sm font-bold">{MAIN_CONTACT.phone}</span>
      </span>
    </a>
  );
}
