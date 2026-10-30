import type { Metadata } from "next";
import { EmbedTheme } from "@/components/embed/embed-theme";
import { CouponShop } from "@/components/coupons/coupon-shop";
import { getCouponProducts } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Dovanų kuponai - Vanduo Marse",
};

export default async function EmbedKuponaiPage({ searchParams }: PageProps<"/embed/kuponai">) {
  const [params, products] = await Promise.all([searchParams, getCouponProducts()]);
  return (
    <>
      <EmbedTheme params={params} />
      <CouponShop products={products} />
    </>
  );
}
