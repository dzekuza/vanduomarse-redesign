"use client";

import { useState, type ReactNode } from "react";
import { Panel } from "@/components/panel";
import type { CouponProduct } from "@/lib/coupons";
import { CouponSteps } from "./coupon-steps";
import { OrderForm } from "./order-form";
import { ProductPicker } from "./product-picker";

/** Coupon page body: header, steps and the coupon picker on the left, the order form (sticky) on the right. */
export function CouponShop({ products, header, initialProductId }: { products: CouponProduct[]; header?: ReactNode; initialProductId?: string }) {
  const [selectedId, setSelectedId] = useState(initialProductId || products[0]?.id || "");
  const selected = products.find((p) => p.id === selectedId);

  if (!products.length) {
    return (
      <div className="space-y-10">
        {header}
        <Panel className="p-6 text-sm text-copy md:p-8">Šiuo metu kuponų neparduodame. Parašyk info@vanduomarse.lt ir padėsime.</Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
      <div className="min-w-0 space-y-10 lg:col-span-2">
        {header}
        {header ? <CouponSteps /> : null}
        <ProductPicker products={products} value={selectedId} onChange={setSelectedId} />
      </div>
      <div id="uzsakymas" className="min-w-0 scroll-mt-32 lg:sticky lg:top-32 lg:self-start">
        {selected ? (
          <OrderForm product={selected} />
        ) : (
          <Panel className="text-sm text-copy">Šis pasiūlymas nebeparduodamas. Pasirink kitą kuponą.</Panel>
        )}
      </div>
    </div>
  );
}
