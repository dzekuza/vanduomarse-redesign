"use client";

import { XIcon } from "@phosphor-icons/react";
import { Cta } from "@/components/cta";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CONTACTS, telHref } from "@/lib/contacts";
import { SERVICES, SERVICE_GALLERY, isBookable, type ServiceId } from "./content";
import { DRAWER_PANEL, MODAL_CLOSE, MODAL_OVERLAY } from "./dialog-motion";
import { useLanding } from "./landing-provider";
import { ServiceBooking } from "./service-booking";
import { ServiceGallery } from "./service-gallery";

interface ServiceDrawerProps {
  open: boolean;
  /** Stays set while the drawer animates out, so the content does not empty mid-exit. */
  serviceId: ServiceId | null;
  onClose: () => void;
}

/** Contacts (and the price calculator for parties) for activities without an online form. */
function ServiceContact({ id }: { id: ServiceId }) {
  const { openCalculator } = useLanding();
  const service = SERVICES[id];
  const contact = CONTACTS.find((c) => c.name === service.contact) ?? CONTACTS[0];
  return (
    <div className="space-y-4 border border-ink bg-foam p-6">
      <p className="text-micro uppercase">Rezervacija pagal užklausą</p>
      <p className="text-sm leading-loose">Šiai veiklai internetinės formos dar nėra. Paskambink ar parašyk, o komanda patikslins laiką ir kainą.</p>
      <div className="flex flex-wrap gap-3">
        <Cta tone="dark" small href={telHref(contact.phone)}>
          {contact.phone}
        </Cta>
        <Cta tone="dark" small href={`mailto:${contact.email}`} className="bg-transparent text-ink ring-1 ring-ink ring-inset hover:bg-ink hover:text-dust">
          {contact.email}
        </Cta>
        {service.cta ? (
          <Cta tone="coral" small onClick={openCalculator} className="hover:bg-ink hover:text-dust">
            {service.cta.label}
          </Cta>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One activity as a side drawer (a bottom sheet with a drag handle on phones):
 * photo, what it is, and either its real booking form or how to book it.
 */
export function ServiceDrawer({ open, serviceId, onClose }: ServiceDrawerProps) {
  const mobile = useIsMobile();
  const service = serviceId ? SERVICES[serviceId] : null;

  return (
    <Drawer open={open && service !== null} onOpenChange={(next) => !next && onClose()} direction={mobile ? "bottom" : "right"}>
      <DrawerContent
        overlayClassName={MODAL_OVERLAY}
        className={DRAWER_PANEL}
      >
        {service ? (
          <>
            <DrawerClose asChild>
              <button type="button" aria-label="Uždaryti veiklos langą" className={MODAL_CLOSE}>
                <XIcon aria-hidden size={22} />
              </button>
            </DrawerClose>
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              <ServiceGallery key={service.id} photos={SERVICE_GALLERY[service.id]} />
              {/* No-drag: the form has its own scrolling day strips, and a swipe there must not close the drawer. */}
              <div data-vaul-no-drag className="min-w-0 p-4 sm:p-6 md:p-10">
                <p className="text-micro uppercase">{service.label}</p>
                <DrawerTitle className="mt-4 mb-3 font-sans text-2xl leading-tight sm:mt-5 sm:mb-4 sm:text-3xl font-bold tracking-tighter whitespace-pre-line text-ink md:text-4xl">{service.title}</DrawerTitle>
                <DrawerDescription className="text-xs leading-loose text-ink">{service.description}</DrawerDescription>
                <ul className="mt-6">
                  {service.facts.map((fact) => (
                    <li key={fact} className="border-t border-line py-3 text-xs leading-relaxed">
                      {fact}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 mb-6 text-sm font-bold sm:mb-8">{service.priceNote}</p>
                {isBookable(service.id) ? <ServiceBooking key={service.id} kind={service.id} /> : <ServiceContact id={service.id} />}
              </div>
            </div>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
