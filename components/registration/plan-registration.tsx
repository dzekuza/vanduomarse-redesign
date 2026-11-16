"use client";

import { useState, type ReactNode } from "react";
import { BookingPanel } from "@/components/booking/booking-panel";
import { BookingPrice } from "@/components/booking/booking-price";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { MAIN_CONTACT, RESERVATION_PHONE } from "@/lib/contacts";
import { CouponDiscountField } from "@/components/coupons/coupon-discount-field";
import { formatEuro } from "@/lib/coupons";
import { discountFor, type CheckedDiscount } from "@/lib/discount-codes";
import type { RegistrationInput } from "@/lib/registration-schema";
import { WAKE_BLACK_FRIDAY_DISCOUNT, WAKE_BLACK_FRIDAY_PATH } from "@/lib/wake-black-friday";
import { MemberPlanCheckout } from "./member-plan-checkout";
import { RegistrationFlow } from "./registration-flow";
import { WakeBlackFridayArtwork } from "./wake-black-friday-artwork";

export interface RegistrationPlan {
  id: string;
  name: string;
  price: number;
}

interface PlanRegistrationProps {
  plan: RegistrationPlan;
  header: ReactNode;
  member: string | null;
  initial?: Partial<RegistrationInput>;
  initialDiscount: CheckedDiscount | null;
  blackFriday: boolean;
  invalidDiscount: boolean;
}

export function PlanRegistration({ plan, header, member, initial, initialDiscount, blackFriday, invalidDiscount }: PlanRegistrationProps) {
  const [discount, setDiscount] = useState(initialDiscount);
  const [busy, setBusy] = useState(false);
  const discountAmount = discount ? discountFor(discount, "planai", plan.price) : 0;
  const total = Math.max(plan.price - discountAmount, 0);
  const checkout = { plan, discountCode: discount?.code, total, setBusy };
  const otherRiderParams = new URLSearchParams({ kitas: "1" });
  if (!blackFriday) {
    otherRiderParams.set("abonementas", plan.id);
    if (discount) otherRiderParams.set("nuolaida", discount.code);
  }
  const otherRiderHref = `${blackFriday ? WAKE_BLACK_FRIDAY_PATH : "/registracija"}?${otherRiderParams}`;

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
      <div className="min-w-0 space-y-8 lg:col-span-2">
        {header}
        <div className="border border-line bg-foam p-4 sm:p-6">
          {member === null
            ? <RegistrationFlow initial={initial} checkout={checkout} />
            : <MemberPlanCheckout name={member} busy={busy} otherRiderHref={otherRiderHref} {...checkout} />}
        </div>
      </div>
      <BookingPanel
        title="Užsakyti" label="Abonemento informacija" photos={SERVICE_GALLERY.wake} photoLabel="WAKE nuotraukos" showOnMobile
        artwork={blackFriday ? <WakeBlackFridayArtwork price={formatEuro(plan.price)} percent={WAKE_BLACK_FRIDAY_DISCOUNT.value} /> : undefined}
      >
        <div className="border-t border-line pt-4">
          <BookingPrice
            amount={
              <>
                {formatEuro(total)}
                {discount ? <del aria-label="Kaina be nuolaidos" className="ml-3 text-sm font-normal text-copy">{formatEuro(plan.price)}</del> : null}
              </>
            }
            note={<p className="leading-relaxed">Apmokėjus abonementas priskiriamas tau. Apyrankę atsiimsi atvykęs į parką.</p>}
          />
        </div>
        {invalidDiscount && !discount ? <p role="status" className="text-sm text-rust-ink">Nuorodoje nurodyto nuolaidos kodo pritaikyti nepavyko.</p> : null}
        {blackFriday ? null : <CouponDiscountField service="planai" discount={discount} amount={discountAmount} disabled={busy} onChange={setDiscount} />}
        <ServiceBookingHelp contact={{ phone: RESERVATION_PHONE, email: MAIN_CONTACT.email }} />
      </BookingPanel>
    </div>
  );
}
