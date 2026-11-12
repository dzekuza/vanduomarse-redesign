import type { ReactNode } from "react";
import Link from "next/link";
import { BookingBreadcrumb } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { Cta } from "@/components/cta";
import { PARK_ADDRESS, SERVICE_GALLERY, SERVICES, type ServicePhoto } from "@/components/landing/content";
import { LandingAccordion } from "@/components/landing/landing-accordion";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { CONTACTS, MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";
import { guestsLabel, type StayType } from "@/lib/cabin";
import type { QuadPageData, SaunaPageData } from "@/lib/data/public-types";
import type { ParkEventData } from "@/lib/park-events";
import { cn } from "@/lib/utils";
import { CELEBRATION_LINKS } from "./celebration-content";
import { ServiceBookingHelp } from "./service-booking-help";
import { SERVICE_PAGES, type ServicePageCopy, type ServiceSlug } from "./service-content";
import { ServicePhotoMosaic } from "./service-photo-mosaic";
import { ServicePricing } from "./service-pricing";
import { ServiceReviews } from "./service-reviews";
import { CalendarSchedule, InquirySchedule } from "./service-schedule";

const SECTIONS = [
  { id: "aprasymas", label: "Aprašymas" },
  { id: "informacija", label: "Informacija" },
  { id: "kainos", label: "Kainos" },
  { id: "galerija", label: "Galerija" },
  { id: "tvarkarastis", label: "Tvarkaraštis" },
  { id: "atsiliepimai", label: "Atsiliepimai" },
  { id: "duk", label: "DUK" },
] as const;

function Section({ id, children }: { id: (typeof SECTIONS)[number]["id"]; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 space-y-5 border-t border-line pt-7">
      <h2 id={`${id}-title`} className="text-tile font-bold">{SECTIONS.find((section) => section.id === id)?.label}</h2>
      {children}
    </section>
  );
}

export function ServicePage({ slug, booking, schedule, sauna, quads, stayTypes, photos, wake }: {
  slug: ServiceSlug;
  booking?: ReactNode | ((header: ReactNode) => ReactNode);
  schedule?: ReactNode;
  sauna?: SaunaPageData;
  quads?: QuadPageData;
  /** Active stay types, for the Nakvynė price list. */
  stayTypes?: StayType[];
  photos?: ServicePhoto[];
  wake?: ParkEventData[];
}) {
  const copy: ServicePageCopy = SERVICE_PAGES[slug];
  const facts = [
    ...(sauna?.saunas ?? []).map(({ id, name, description, rates }) => ({
      id, label: name, value: [description, `Iki ${rates.maxParty} žmonių.`].filter(Boolean).join(" "),
    })),
    ...(quads?.tourRoutes ?? []).map(({ id, name, kilometres, minUnits }) => ({
      id, label: name, value: `${kilometres} km · Mažiausias keturračių skaičius – ${minUnits}.`,
    })),
    ...(stayTypes ?? []).map(({ id, label, maxGuests, note }) => ({
      id, label, value: [guestsLabel(maxGuests), note].filter(Boolean).join(" · "),
    })),
    ...copy.facts.map((fact) => ({ ...fact, id: fact.label })),
  ];
  const gallery = photos ?? SERVICE_GALLERY[copy.service];
  const contact = CONTACTS.find(({ name }) => name === SERVICES[copy.service].contact) ?? MAIN_CONTACT;
  const isCelebration = copy.service === "party";
  const bookingTitle = slug === "vandenlentes" ? "Užsakyti" : slug === "sventes" ? "Šventės skaičiuoklė"
    : booking ? "Rezervuoti" : isCelebration ? "Gauk šventės pasiūlymą"
    : slug === "restoranas" ? "Rezervuok staliuką" : "Sužinok plaukimo laikus";
  const bookingHeader = (
    <div className="mb-5 space-y-2">
      <p className="text-micro uppercase text-copy">{copy.label}</p>
      <h2 id="service-booking-title" className="text-tile font-bold">{bookingTitle}</h2>
      {copy.bookingIntro ? <p className="text-xs leading-relaxed text-copy">{copy.bookingIntro}</p> : null}
    </div>
  );
  const customBookingLayout = typeof booking === "function";

  return (
    <BookingPage>
      <div className="theme-reservation space-y-5 px-gutter pt-8 pb-16 md:pt-10 lg:pb-24">
        <BookingBreadcrumb crumb={copy.label} />
        <div className="grid items-start gap-y-8 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
          <header className="min-w-0 space-y-5 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            <ServiceGallery photos={gallery} variant="hero" label={`${copy.label}: nuotraukos`} />
            <h1 className="text-total font-bold tracking-tighter uppercase sm:text-title">{copy.title}</h1>
            <p className="text-sm leading-loose text-copy">{copy.summary}</p>
            <nav aria-label="Puslapio skiltys" className="flex flex-wrap gap-2">
              {SECTIONS.map(({ id, label }) => (
                <Link key={id} href={`#${id}`} className="inline-flex min-h-11 items-center border border-line px-3 text-xs hover:border-ink hover:bg-foam">{label}</Link>
              ))}
            </nav>
          </header>
          <aside id="rezervuoti" aria-labelledby="service-booking-title" className={cn(
            "min-w-0 scroll-mt-32 border border-line bg-foam lg:sticky lg:top-32 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-9rem)]",
            customBookingLayout ? "lg:flex lg:flex-col" : "p-4 sm:p-6 lg:overflow-y-auto",
          )}>
            {customBookingLayout ? booking(bookingHeader) : <>{bookingHeader}{booking}</>}
            {slug === "keturraciu-nuoma" ? <ServiceBookingHelp contact={contact} /> : !booking && (
              <div className="space-y-3 border-t border-line pt-4">
                {isCelebration ? <Cta tone="dark" small className="w-full" href="/sventes#rezervuoti">Skaičiuoti šventės kainą</Cta> : (
                  <Cta tone="dark" small className="w-full" href={telHref(contact.phone)}>{contact.phone}</Cta>
                )}
                <a href={`mailto:${contact.email}`} className="flex min-h-11 w-fit max-w-full items-center break-all text-xs underline underline-offset-4 hover:text-rust">{contact.email}</a>
              </div>
            )}
          </aside>
          <div className="min-w-0 space-y-10 lg:col-span-8 lg:col-start-1 lg:row-start-2">
            <Section id="aprasymas">
              <p className="text-sm leading-loose text-copy">{copy.description}</p>
              {isCelebration ? <div className="flex flex-wrap gap-2">
                {Object.entries(CELEBRATION_LINKS).filter(([key]) => key !== slug).map(([key, label]) => (
                  <Link key={key} href={`/${key}`} className="inline-flex min-h-11 items-center border border-line px-3 text-xs font-bold hover:border-ink">{label}</Link>
                ))}
              </div> : null}
            </Section>
            <Section id="informacija">
              <dl className="grid gap-2 lg:grid-cols-2">
                {facts.map(({ id, label, value }) => (
                  <div key={id} className="space-y-2 border border-line bg-card p-4">
                    <dt className="text-xs font-bold">{label}</dt>
                    <dd className="text-xs leading-relaxed text-copy">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-x-5">
                <a href={MAPS_URL} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">{PARK_ADDRESS.compact}, Kauno r.</a>
                {slug === "pirtis" ? <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">Susisiekti dėl pirties</a> : null}
              </div>
            </Section>
            <Section id="kainos"><ServicePricing slug={slug} sauna={sauna} quads={quads} stayTypes={stayTypes} /></Section>
            <Section id="galerija"><ServicePhotoMosaic photos={gallery} label={`${copy.label}: galerija`} /></Section>
            <Section id="tvarkarastis">{schedule ?? (booking ? <CalendarSchedule wake={wake} note={copy.availabilityNote} /> : <InquirySchedule wake={wake} note={copy.availabilityNote} />)}</Section>
            <Section id="atsiliepimai"><ServiceReviews service={copy.service} /></Section>
            <Section id="duk">
              <LandingAccordion rows={copy.questions.map((question, index) => ({ ...question, id: `${slug}-${index}` }))} variant="faq" mode="multiple" />
            </Section>
          </div>
        </div>
      </div>
    </BookingPage>
  );
}
