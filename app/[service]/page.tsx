import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CelebrationCalculator } from "@/components/calculator/celebration-calculator";
import { CelebrationSchedule } from "@/components/services/celebration-schedule";
import { TrackViewItem } from "@/components/analytics/track-view-item";
import { JsonLd } from "@/components/json-ld";
import { SERVICE_GALLERY, SERVICES } from "@/components/landing/content";
import { activityPhotos } from "@/components/reservation/activity-photos";
import { LiveActivityProvider, LiveBooking, LiveSchedule } from "@/components/services/live-activity";
import { SERVICE_PAGES, isServiceSlug, type ServicePageCopy } from "@/components/services/service-content";
import { ServicePage } from "@/components/services/service-page";
import { WakeServiceBooking } from "@/components/services/wake-service-booking";
import { ACADEMY_CONTACT } from "@/lib/contacts";
import { getServicePageContent, isServicePageHidden } from "@/lib/data/page-content";
import { getCabinPageData, getCalculatorCatalog, getCelebrationSchedule, getParkEvents, getQuadPageData, getSaunaPageData, getWakeOffers } from "@/lib/data/public";
import type { ActivityKind } from "@/lib/analytics";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { SERVICE_OG_IMAGES, metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/structured-data";
import { paymentsEnabled } from "@/lib/stripe";

interface Props {
  params: Promise<{ service: string }>;
}

/**
 * Service pages are cached and rebuilt in the background every 5 minutes (prices and copy edited in /admin show up
 * within that). Live availability and the signed-in customer load in the browser from /api/availability, and `?seansas=`
 * is read there too, so nothing here depends on the request.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return Object.keys(SERVICE_PAGES).map((service) => ({ service }));
}

/** What a visit to each service page counts as in GA and Meta (ViewContent): sauna, stay, quads, wake, or an event enquiry. */
const VIEW_KIND: Partial<Record<string, ActivityKind>> = {
  pirtis: "sauna",
  nakvyne: "stay",
  "keturraciu-nuoma": "quad_rental",
  vandenlentes: "plan",
  sventes: "event_inquiry",
  vestuves: "event_inquiry",
  gimtadieniai: "event_inquiry",
  "imoniu-renginiai": "event_inquiry",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  if (!isServiceSlug(service) || (await isServicePageHidden(service))) notFound();
  const { copy: { title, summary, description, metaDescription: custom, service: id } } = await getServicePageContent(service);
  return pageMetadata({ title, description: custom ?? metaDescription([summary, description]), path: `/${service}`, image: SERVICE_OG_IMAGES[id] ?? { url: SERVICES[id].photo, alt: SERVICES[id].alt } });
}

export default async function ActivityPage({ params }: Props) {
  const { service } = await params;
  if (!isServiceSlug(service) || (await isServicePageHidden(service))) notFound();
  const { copy }: { copy: ServicePageCopy } = await getServicePageContent(service);
  const schema = (
    <>
      {VIEW_KIND[service] ? <TrackViewItem kind={VIEW_KIND[service]} itemName={copy.title} /> : null}
      <JsonLd data={serviceSchema({ name: copy.title, description: copy.summary, path: `/${service}`, image: (SERVICE_OG_IMAGES[copy.service] ?? { url: SERVICES[copy.service].photo }).url })} />
      <JsonLd data={breadcrumbSchema({ name: copy.title, path: `/${service}` })} />
      {copy.questions.length > 0 && <JsonLd data={faqSchema(copy.questions.map(({ title, body }) => ({ q: title, a: body })))} />}
    </>
  );
  const activity = copy.activity;
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };

  if (activity) {
    const [sauna, cabin, quads] = await Promise.all([getSaunaPageData(availabilityWindow), getCabinPageData(availabilityWindow), getQuadPageData(availabilityWindow)]);
    const data = { sauna, cabin, quads };
    const photos = activity === "pirtis"
      ? Array.from(new Map([...SERVICE_GALLERY.sauna, ...activityPhotos(activity, data)].map((photo) => [photo.src, photo])).values())
      : activityPhotos(activity, data);
    return (
      <LiveActivityProvider activity={activity} initial={data}>
        {schema}
        <ServicePage
          slug={service}
          sauna={activity === "pirtis" ? sauna : undefined}
          quads={activity === "keturraciai" ? quads : undefined}
          stayTypes={activity === "nakvyne" ? cabin.stayTypes : undefined}
          photos={photos}
          booking={<LiveBooking activity={activity} payments={paymentsEnabled()} />}
          schedule={<LiveSchedule activity={activity} />}
        />
      </LiveActivityProvider>
    );
  }

  if (service === "vandenlentes") {
    const [events, wakeOffers] = await Promise.all([getParkEvents(), getWakeOffers()]);
    return (
      <>
        {schema}
        <ServicePage slug={service} wake={events.filter(({ category }) => category === "akademija")}
          booking={<WakeServiceBooking products={wakeOffers} contact={ACADEMY_CONTACT} />} />
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
