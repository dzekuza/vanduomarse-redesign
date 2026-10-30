import type { Metadata } from "next";
import { CouponShop } from "@/components/coupons/coupon-shop";
import { getCouponProducts } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Dovanų kuponai - Vanduo Marse",
};

export default async function EmbedKuponaiPage() {
  const products = await getCouponProducts();
  return <CouponShop products={products} />;
}
