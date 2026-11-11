"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { loadCalculatorCatalog } from "@/app/actions/booking-data";
import { BookingCard, type BookingStep } from "@/components/booking/booking-card";
import { SteppedBooking } from "@/components/booking/stepped";
import { CALCULATOR_SECTIONS } from "@/components/calculator/calculator-sections";
import { EstimateBreakdown } from "@/components/calculator/estimate-summary";
import { useEventCalculator } from "@/components/calculator/use-event-calculator";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { EMPTY_CATALOG, formatMoney, type CalculatorCatalog } from "@/lib/event-pricing";
import { DRAWER_PANEL, MODAL_CLOSE, MODAL_OVERLAY } from "./dialog-motion";

/** Header with the live total, then the questions as steps and a last step with the breakdown and the inquiry form. */
function CalculatorPanel() {
  const [catalog, setCatalog] = useState<CalculatorCatalog>(EMPTY_CATALOG);
  const calc = useEventCalculator(undefined, catalog);
  const { result, input, guests, space, preset } = calc;

  useEffect(() => {
    // The home page is static, so the live cabin and sauna prices load when the drawer opens.
    void loadCalculatorCatalog().then((res) => "data" in res && setCatalog(res.data)).catch(() => undefined);
  }, []);

  const steps: BookingStep[] = [
    ...CALCULATOR_SECTIONS.map(({ id, label, Section }) => ({ id, label, content: <Section calc={calc} /> })),
    {
      id: "summary",
      label: "Suvestinė",
      content: (
        <EstimateBreakdown
          estimate={result}
          input={input}
          guests={guests}
          spaceLabel={space?.label ?? ""}
          typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null}
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 bg-ink px-4 py-4 pr-16 text-dust sm:px-6 sm:py-5 sm:pr-20 md:px-10 md:py-7 md:pr-24">
        <p className="text-micro uppercase">Šventės skaičiuoklė</p>
        <DrawerTitle className="sr-only">Šventės skaičiuoklė: preliminari kaina</DrawerTitle>
        <DrawerDescription className="sr-only">Pasirink renginio tipą, svečius, erdvę ir paslaugas: kaina skaičiuojama iškart.</DrawerDescription>
        <p aria-live="polite" className="font-display mt-2 text-total font-bold sm:mt-3">
          {formatMoney(result.total)}
        </p>
        <p className="mt-1 text-xs text-dust/70">
          Preliminari kaina · {guests} asm.
          {result.perGuest ? ` · ≈ ${formatMoney(result.perGuest)} vienam svečiui` : ""}
        </p>
      </div>
      <div data-vaul-no-drag className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="min-w-0 p-4 sm:p-6 md:p-10">
          <SteppedBooking>
            <BookingCard
              steps={steps}
              summary={<p className="text-sm text-ink/60">Kainos su 21% PVM, orientacinės.</p>}
              action={null}
            />
          </SteppedBooking>
        </div>
      </div>
    </div>
  );
}

interface CalculatorDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** The event price calculator as a drawer (bottom sheet on phones), total pinned in its header. */
export function CalculatorDrawer({ open, onClose }: CalculatorDrawerProps) {
  const mobile = useIsMobile();

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()} direction={mobile ? "bottom" : "right"}>
      <DrawerContent overlayClassName={MODAL_OVERLAY} className={DRAWER_PANEL}>
        <DrawerClose asChild>
          <button type="button" aria-label="Uždaryti skaičiuoklę" className={`${MODAL_CLOSE} bg-dust! text-ink!`}>
            <XIcon aria-hidden size={22} />
          </button>
        </DrawerClose>
        <CalculatorPanel />
      </DrawerContent>
    </Drawer>
  );
}
