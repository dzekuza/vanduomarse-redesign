import type { Metadata } from "next";
import { AccountLogin } from "@/components/account/account-login";
import { ProfileCard } from "@/components/account/profile-card";
import { AccountTabs } from "@/components/account/account-tabs";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { loadMyInquiries, loadMyRequests, loadMyRiders } from "@/lib/account-data";
import { getCustomer } from "@/lib/customer";

export const metadata: Metadata = {
  title: "Mano rezervacijos - Vanduo Marse",
  robots: { index: false },
};

/** "Mano rezervacijos": sign in with a code, then the customer's reservations first and their account details beside them. */
export default async function AccountPage() {
  const customer = await getCustomer();
  const [requests, inquiries, riders] = customer ? await Promise.all([loadMyRequests(), loadMyInquiries(), loadMyRiders()]) : [[], [], []];

  return (
    <BookingPage>
      <div className="theme-reservation space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <BookingHeader crumb="Mano rezervacijos" title={["Mano", "rezervacijos"]} />
        {customer ? (
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              <AccountTabs requests={requests} inquiries={inquiries} riders={riders} />
            </div>
            <div className="lg:col-span-1">
              <ProfileCard customer={customer} />
            </div>
          </div>
        ) : (
          <AccountLogin />
        )}
      </div>
    </BookingPage>
  );
}
