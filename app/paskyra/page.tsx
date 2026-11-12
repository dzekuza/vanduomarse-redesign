import type { Metadata } from "next";
import Image from "next/image";
import { AccountLogin } from "@/components/account/account-login";
import { ProfileCard } from "@/components/account/profile-card";
import { AccountTabs } from "@/components/account/account-tabs";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { loadMyCoupons, loadMyInquiries, loadMyRequests, loadMyRiders } from "@/lib/account-data";
import { getCustomer } from "@/lib/customer";

export const metadata: Metadata = {
  title: "Mano rezervacijos - Vanduo Marse",
  robots: { index: false },
};

/** "Mano rezervacijos": sign in with a code, then the customer's reservations first and their account details beside them. */
export default async function AccountPage() {
  const customer = await getCustomer();
  const [requests, inquiries, riders, coupons] = customer ? await Promise.all([loadMyRequests(), loadMyInquiries(), loadMyRiders(), loadMyCoupons()]) : [[], [], [], []];

  if (!customer) {
    return (
      <BookingPage>
        <div className="theme-reservation grid gap-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-10">
            <BookingHeader crumb="Mano rezervacijos" title={["Prisijunkite arba", "sukurkite paskyrą"]} split />
            <AccountLogin />
          </div>
          <div className="relative min-h-72 overflow-hidden lg:min-h-96">
            <Image src="/landing/aerial.webp" alt="Marso parkas iš oro, Kauno rajone" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </BookingPage>
    );
  }

  return (
    <BookingPage>
      <div className="theme-reservation space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <BookingHeader crumb="Mano rezervacijos" title={["Mano", "rezervacijos"]} />
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <AccountTabs requests={requests} inquiries={inquiries} riders={riders} coupons={coupons} />
          </div>
          <div className="lg:col-span-1">
            <ProfileCard customer={customer} />
          </div>
        </div>
      </div>
    </BookingPage>
  );
}
