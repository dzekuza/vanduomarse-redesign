import type { Metadata } from "next";
import { BookingPage } from "@/components/booking/booking-page";
import { CouponIntro } from "@/components/coupons/coupon-intro";
import { CouponShop } from "@/components/coupons/coupon-shop";
import { getCouponProducts } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Dovanų kuponai - Vanduo Marse",
  description: "Padovanok dieną Marse: dovanų kuponai plaukimui, pirčiai ar nakvynei. Kodas ateina el. paštu, galioja 12 mėnesių.",
};

export default async function CouponsPage() {
  const products = await getCouponProducts();
  return (
    <BookingPage>
      <CouponIntro />
      <CouponShop products={products} />
    </BookingPage>
  );
}
