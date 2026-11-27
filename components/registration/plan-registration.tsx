"use client";

import { useState, type ReactNode } from "react";
import { TrackViewItem } from "@/components/analytics/track-view-item";
import { BookingPanel } from "@/components/booking/booking-panel";
import { BookingPrice } from "@/components/booking/booking-price";
import { SERVICE_GALLERY } from "@/components/landing/content";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { MAIN_CONTACT, RESERVATION_PHONE } from "@/lib/contacts";
import { CouponDiscountField } from "@/components/coupons/coupon-discount-field";
import { formatEuro } from "@/lib/coupons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { discountFor, type CheckedDiscount } from "@/lib/discount-codes";
import type { RegistrationInput } from "@/lib/registration-schema";
import { WAKE_BLACK_FRIDAY_DISCOUNT } from "@/lib/wake-black-friday";
import { MemberPlanCheckout } from "./member-plan-checkout";
import { PassBuyForm } from "./pass-buy-form";
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
  // On the campaign page the Black Friday row from the database (its live percentage) is the default discount.
  const campaign = blackFriday && initialDiscount?.code === WAKE_BLACK_FRIDAY_DISCOUNT.code ? initialDiscount : WAKE_BLACK_FRIDAY_DISCOUNT;
  const [busy, setBusy] = useState(false);
  const discountAmount = discount ? discountFor(discount, "planai", plan.price) : 0;
  const total = Math.max(plan.price - discountAmount, 0);
  const checkout = { plan, discountCode: discount?.code, total, setBusy };
  const buyer = initial?.email ? { name: [initial.name, initial.surname].filter(Boolean).join(" "), email: initial.email } : undefined;
  /** Which purchase the visitor is looking at: it decides what the price note promises. */
  const [mode, setMode] = useState<"sau" | "draugui">("sau");
  const priceNote =
    mode === "draugui"
      ? "Apmokėjęs gausi abonemento kodą el. paštu: perduok jį draugui. Draugas užsiregistruoja ir parke kasoje pasako kodą."
      : member !== null
        ? "Apmokėjus abonementas priskiriamas tavo profiliui. Apyrankę atsiimsi atvykęs į parką."
        : "Apmokėjęs gausi abonemento kodą el. paštu. Užsiregistravęs ir atvykęs į parką, pasakyk kodą kasoje: darbuotojas priskirs abonementą ir apyrankę.";

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
      {/* Landing view for ads: initial price and code only, so a later code change does not count a second view. */}
      <TrackViewItem kind="plan" itemName={plan.name} value={Math.max(plan.price - (initialDiscount ? discountFor(initialDiscount, "planai", plan.price) : 0), 0)} coupon={initialDiscount?.code} />
      <div className="min-w-0 space-y-8 lg:col-span-2">
        {header}
        <div className="border border-line bg-foam p-4 sm:p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v === "draugui" ? "draugui" : "sau")} className="gap-6">
            <TabsList>
              <TabsTrigger value="sau" className="min-h-11" disabled={busy}>
                Perku sau
              </TabsTrigger>
              <TabsTrigger value="draugui" className="min-h-11" disabled={busy}>
                Perku draugui
              </TabsTrigger>
            </TabsList>
            {/* Both stay mounted, so switching tabs keeps what was typed. forceMount stops Radix hiding the inactive one, hence the class. */}
            <TabsContent value="sau" forceMount className="data-[state=inactive]:hidden">
              {member === null
                ? <PassBuyForm gift={false} buyer={buyer} {...checkout} />
                : <MemberPlanCheckout name={member} busy={busy} {...checkout} />}
            </TabsContent>
            <TabsContent value="draugui" forceMount className="data-[state=inactive]:hidden">
              <PassBuyForm gift buyer={buyer} {...checkout} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <BookingPanel
        title="Užsakyti" label="Abonemento informacija" photos={SERVICE_GALLERY.wake} photoLabel="WAKE nuotraukos" showOnMobile
        artwork={blackFriday ? <WakeBlackFridayArtwork price={formatEuro(plan.price)} percent={campaign.value} /> : undefined}
      >
        <div className="border-t border-line pt-4">
          <BookingPrice
            amount={
              <>
                {formatEuro(total)}
                {discount ? <del aria-label="Kaina be nuolaidos" className="ml-3 text-sm font-normal text-copy">{formatEuro(plan.price)}</del> : null}
              </>
            }
            note={<p className="leading-relaxed">{priceNote}</p>}
          />
        </div>
        {invalidDiscount && !discount ? <p role="status" className="text-sm text-rust-ink">Nuorodoje nurodyto nuolaidos kodo pritaikyti nepavyko.</p> : null}
        {/* On the campaign page the Black Friday code is the default: another code replaces it (an order holds one code), and removing that code brings the campaign discount back. */}
        <CouponDiscountField
          service="planai"
          discount={blackFriday && discount?.code === WAKE_BLACK_FRIDAY_DISCOUNT.code ? null : discount}
          amount={discountAmount}
          disabled={busy}
          onChange={(next) => setDiscount(next ?? (blackFriday ? campaign : null))}
          hint={blackFriday ? "Taikomas vienas kodas: jis pakeičia Black Friday nuolaidą." : undefined}
        />
        <ServiceBookingHelp contact={{ phone: RESERVATION_PHONE, email: MAIN_CONTACT.email }} />
      </BookingPanel>
    </div>
  );
}
