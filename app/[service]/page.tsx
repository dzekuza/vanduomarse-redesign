import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SERVICE_GALLERY, SERVICES } from "@/components/landing/content";
import { activityPhotos } from "@/components/reservation/activity-photos";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { QuadSchedule } from "@/components/services/quad-schedule";
import { SaunaServiceSchedule } from "@/components/services/sauna-service-schedule";
import { SERVICE_PAGES, isServiceSlug, type ServicePageCopy } from "@/components/services/service-content";
import { ServicePage } from "@/components/services/service-page";
import { StayServiceSchedule } from "@/components/services/stay-service-schedule";
import { WakeServiceBooking } from "@/components/services/wake-service-booking";
import { CONTACTS, MAIN_CONTACT } from "@/lib/contacts";
import { getCustomer } from "@/lib/customer";
import { getCabinPageData, getCouponProducts, getParkEvents, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { serviceSchema } from "@/lib/structured-data";
import { paymentsEnabled } from "@/lib/stripe";

interface Props {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ seansas?: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const { title, summary, description, service: id } = SERVICE_PAGES[service];
  return pageMetadata({ title, description: metaDescription([summary, description]), path: `/${service}`, image: { url: SERVICES[id].photo, alt: SERVICES[id].alt } });
}

export default async function ActivityPage({ params, searchParams }: Props) {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const copy: ServicePageCopy = SERVICE_PAGES[service];
  const schema = <JsonLd data={serviceSchema({ name: copy.title, description: copy.summary, path: `/${service}` })} />;
  const activity = copy.activity;
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };

  if (activity) {
    const { seansas } = await searchParams;
    const eventId = Array.isArray(seansas) ? seansas[0] : seansas;
    const [sauna, cabin, quads, customer] = await Promise.all([
      getSaunaPageData(availabilityWindow), getCabinPageData(availabilityWindow), getQuadPageData(availabilityWindow), getCustomer(),
    ]);
    const data = { sauna, cabin, quads };
    const saunaDay = activity === "pirtis" ? sauna.events.find(({ key }) => key === eventId)?.date : undefined;
    const photos = activity === "pirtis"
      ? Array.from(new Map([...SERVICE_GALLERY.sauna, ...activityPhotos(activity, data)].map((photo) => [photo.src, photo])).values())
      : activityPhotos(activity, data);
    return (
      <>
        {schema}
        <ServicePage
          slug={service}
          sauna={activity === "pirtis" ? sauna : undefined}
          quads={activity === "keturraciai" ? quads : undefined}
          stayTypes={activity === "nakvyne" ? cabin.stayTypes : undefined}
          photos={photos}
          booking={<ReservationFlow activity={activity} header={null} data={data} initialDay={saunaDay} payments={paymentsEnabled()} initialCustomer={customer} />}
          schedule={activity === "pirtis" ? <SaunaServiceSchedule data={sauna} initialDay={saunaDay} /> : activity === "keturraciai" ? <QuadSchedule data={quads} /> : <StayServiceSchedule data={cabin} />}
        />
      </>
    );
  }

  if (service === "vandenlentes") {
    const [events, products] = await Promise.all([getParkEvents(), getCouponProducts()]);
    const contact = CONTACTS.find(({ name }) => name === SERVICES.wake.contact) ?? MAIN_CONTACT;
    return (
      <>
        {schema}
        <ServicePage slug={service} wake={events.filter(({ category }) => category === "akademija")}
          booking={<WakeServiceBooking products={products.filter(({ service }) => service === "kabelis")} contact={contact} />} />
      </>
    );
  }
  return (
    <>
      {schema}
      <ServicePage slug={service} />
    </>
  );
}
