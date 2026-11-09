import { MAIN_CONTACT, telHref } from "@/lib/contacts";
import { Eyebrow } from "./eyebrow";

/** Phone contact row at the bottom of a side panel. */
export function PhoneHelp({ label = "Lengviau pasikalbėti?", phone = MAIN_CONTACT.phone }: { label?: string; phone?: string }) {
  return (
    <a href={telHref(phone)} className="flex min-h-11 items-center justify-between gap-4 border-t border-line pt-4 text-xs hover:text-rust">
      <span>
        <Eyebrow as="span" className="block">
          {label}
        </Eyebrow>
        <span className="block text-sm font-bold">{phone}</span>
      </span>
    </a>
  );
}
