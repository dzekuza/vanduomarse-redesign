import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { CouponShop } from "@/components/coupons/coupon-shop";
import { COUPON_VALID_MONTHS } from "@/lib/coupons";
import { getCouponProducts } from "@/lib/data/public";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Dovanų kuponai pirčiai, nakvynei ir plaukimui",
  description: "Padovanok dieną Marse: dovanų kuponai plaukimui, pirčiai ar nakvynei Kauno rajone. Kodas ateina el. paštu, kuponas galioja 12 mėnesių.",
  path: "/kuponai",
});

export default async function CouponsPage() {
  const products = await getCouponProducts();
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <CouponShop
          products={products}
          header={
            <BookingHeader
              crumb="Dovanų kuponai"
              title={["Padovanok dieną", "ant vandens"]}
              intro={`Popierinį kuponą gali panaudoti vienu kartu plaukimui, pirčiai ar nakvynei. Jis galioja ${COUPON_VALID_MONTHS} mėn. nuo apmokėjimo. Didesnei dovanai rinkis kelis mažesnės vertės kuponus.`}
            />
          }
        />
      </div>
    </BookingPage>
  );
}
