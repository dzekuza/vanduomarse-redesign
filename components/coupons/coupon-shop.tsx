"use client";

import { useState, type ReactNode } from "react";
import type { CouponOrderResult } from "@/app/actions/coupons";
import { Panel } from "@/components/panel";
import type { CouponProduct } from "@/lib/coupons";
import { CouponSteps } from "./coupon-steps";
import { OrderConfirmation } from "./order-confirmation";
import { OrderForm } from "./order-form";
import { ProductPicker } from "./product-picker";

/** Coupon page body: header, steps and the coupon picker on the left, the order form (sticky) or its confirmation on the right. */
export function CouponShop({ products, header }: { products: CouponProduct[]; header?: ReactNode }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [ordered, setOrdered] = useState<{ order: CouponOrderResult; email: string } | null>(null);
  const selected = products.find((p) => p.id === selectedId);

  if (!selected) {
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
      <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
        {ordered ? (
          <OrderConfirmation order={ordered.order} email={ordered.email} onReset={() => setOrdered(null)} />
        ) : (
          <OrderForm product={selected} onOrdered={(order, email) => setOrdered({ order, email })} />
        )}
      </div>
    </div>
  );
}
