"use client";

import { useState } from "react";
import type { CouponOrderResult } from "@/app/actions/coupons";
import type { CouponProduct } from "@/lib/coupons";
import { OrderConfirmation } from "./order-confirmation";
import { OrderForm } from "./order-form";
import { ProductPicker } from "./product-picker";

/** Pick a coupon, fill in the order, see the confirmation. */
export function CouponShop({ products }: { products: CouponProduct[] }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [ordered, setOrdered] = useState<{ order: CouponOrderResult; email: string } | null>(null);
  const selected = products.find((p) => p.id === selectedId);

  if (!selected) {
    return (
      <section className="px-6 pb-20 md:px-10">
        <p className="rounded-tile bg-card p-6 text-ink/80 md:p-8">Šiuo metu kuponų neparduodame. Parašykite info@vanduomarse.lt ir padėsime.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-8 px-6 pb-20 md:px-10 lg:grid-cols-5 lg:items-start lg:gap-12">
      <div className="min-w-0 lg:col-span-3">
        <ProductPicker products={products} value={selectedId} onChange={setSelectedId} />
      </div>
      <div className="min-w-0 lg:sticky lg:top-28 lg:col-span-2">
        {ordered ? (
          <OrderConfirmation order={ordered.order} email={ordered.email} onReset={() => setOrdered(null)} />
        ) : (
          <OrderForm product={selected} onOrdered={(order, email) => setOrdered({ order, email })} />
        )}
      </div>
    </section>
  );
}
