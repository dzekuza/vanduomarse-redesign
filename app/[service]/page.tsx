import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CelebrationCalculator } from "@/components/calculator/celebration-calculator";
import { CelebrationSchedule } from "@/components/services/celebration-schedule";
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
import { ACADEMY_CONTACT } from "@/lib/contacts";
import { getCustomer } from "@/lib/customer";
import { getCabinPageData, getCalculatorCatalog, getCelebrationSchedule, getCouponProducts, getParkEvents, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/structured-data";
import { paymentsEnabled } from "@/lib/stripe";

interface Props {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ seansas?: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const { title, summary, description, metaDescription: custom, service: id }: ServicePageCopy = SERVICE_PAGES[service];
  return pageMetadata({ title, description: custom ?? metaDescription([summary, description]), path: `/${service}`, image: { url: SERVICES[id].photo, alt: SERVICES[id].alt } });
}

export default async function ActivityPage({ params, searchParams }: Props) {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const copy: ServicePageCopy = SERVICE_PAGES[service];
  const schema = (
    <>
      <JsonLd data={serviceSchema({ name: copy.title, description: copy.summary, path: `/${service}` })} />
      <JsonLd data={breadcrumbSchema({ name: copy.title, path: `/${service}` })} />
      {copy.questions.length > 0 && <JsonLd data={faqSchema(copy.questions.map(({ title, body }) => ({ q: title, a: body })))} />}
    </>
  );
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
    return (
      <>
        {schema}
        <ServicePage slug={service} wake={events.filter(({ category }) => category === "akademija")}
          booking={<WakeServiceBooking products={products.filter(({ service }) => service === "kabelis")} contact={ACADEMY_CONTACT} />} />
      </>
    );
  }
  if (service === "sventes") {
    const [calendar, catalog] = await Promise.all([getCelebrationSchedule(), getCalculatorCatalog()]);
    return (
      <>
        {schema}
        <ServicePage slug={service}
          booking={(header) => <CelebrationCalculator today={calendar.today} catalog={catalog} header={header} />}
          schedule={<CelebrationSchedule data={calendar} />} />
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
