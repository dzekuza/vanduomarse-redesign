import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICE_GALLERY, SERVICES } from "@/components/landing/content";
import { activityPhotos } from "@/components/reservation/activity-photos";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { QuadServiceSchedule, QuadServiceSidebar, QuadServiceTools } from "@/components/services/quad-service-tools";
import { SaunaServiceSchedule } from "@/components/services/sauna-service-schedule";
import { SERVICE_PAGES, isServiceSlug, type ServicePageCopy } from "@/components/services/service-content";
import { ServicePage } from "@/components/services/service-page";
import { StayServiceSchedule } from "@/components/services/stay-service-schedule";
import { WakeServiceBooking } from "@/components/services/wake-service-booking";
import { ACADEMY_CONTACT } from "@/lib/contacts";
import { getCustomer } from "@/lib/customer";
import { getCabinPageData, getCouponProducts, getParkEvents, getQuadPageData, getSaunaPageData } from "@/lib/data/public";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { paymentsEnabled } from "@/lib/stripe";

interface Props {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ seansas?: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const { title, summary, metaDescription, service: id }: ServicePageCopy = SERVICE_PAGES[service];
  const path = `/${service}`;
  const description = metaDescription ?? summary;
  return {
    title: `${title} | Vanduo Marse`,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: [{ url: SERVICES[id].photo, alt: SERVICES[id].alt }] },
  };
}

export default async function ActivityPage({ params, searchParams }: Props) {
  const { service } = await params;
  if (!isServiceSlug(service)) notFound();
  const copy: ServicePageCopy = SERVICE_PAGES[service];
  const activity = copy.activity;
  const availabilityWindow = { days: RESERVATION_DAYS, now: new Date() };

  if (activity === "keturraciai") {
    const quads = await getQuadPageData(availabilityWindow);
    return (
      <QuadServiceTools data={quads}>
        <ServicePage slug={service} photos={activityPhotos(activity)} booking={<QuadServiceSidebar />} schedule={<QuadServiceSchedule />} />
      </QuadServiceTools>
    );
  }

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
      <ServicePage
        slug={service}
        sauna={activity === "pirtis" ? sauna : undefined}
        photos={photos}
        booking={<ReservationFlow activity={activity} header={null} data={data} initialDay={saunaDay} payments={paymentsEnabled()} initialCustomer={customer} />}
        schedule={activity === "pirtis" ? <SaunaServiceSchedule data={sauna} initialDay={saunaDay} /> : <StayServiceSchedule data={cabin} />}
      />
    );
  }

  if (service === "vandenlentes") {
    const [events, products] = await Promise.all([getParkEvents(), getCouponProducts()]);
    return (
      <ServicePage slug={service} wake={events.filter(({ category }) => category === "akademija")}
        booking={<WakeServiceBooking products={products.filter(({ service }) => service === "kabelis")} contact={ACADEMY_CONTACT} />} />
    );
  }

  return <ServicePage slug={service} />;
}
