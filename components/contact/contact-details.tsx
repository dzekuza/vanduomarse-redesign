import { ParkMap } from "./park-map";
import { PARK_ADDRESS } from "@/components/landing/content";
import { CONTACTS, INSTAGRAM_URL, MAPS_URL, telHref } from "@/lib/contacts";

const LINK = "inline-flex min-h-11 items-center text-xs hover:text-rust";

/** Address, map link and every contact of the park, for the contacts page. */
export function ContactDetails() {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
      <section className="space-y-2 border-t border-line pt-4 sm:col-span-2">
        <h2 className="text-sm font-bold">Adresas</h2>
        <address className="text-xs leading-loose not-italic">
          {PARK_ADDRESS.street}, {PARK_ADDRESS.village}
          <br />
          {PARK_ADDRESS.area}
        </address>
        <a href={MAPS_URL} target="_blank" rel="noopener" className={LINK}>
          Atidaryti žemėlapyje
        </a>
        <ParkMap />
      </section>
      {CONTACTS.map(({ name, email, phone }) => (
        <section key={name} className="border-t border-line pt-4">
          <h2 className="text-sm font-bold">{name}</h2>
          <div className="flex flex-col items-start">
            <a href={`mailto:${email}`} className={LINK}>
              {email}
            </a>
            <a href={telHref(phone)} className={LINK}>
              {phone}
            </a>
          </div>
        </section>
      ))}
      <section className="border-t border-line pt-4">
        <h2 className="text-sm font-bold">Socialiniai tinklai</h2>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className={LINK}>
          Instagram
        </a>
      </section>
    </div>
  );
}
