import { CaretUpIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ActivityId } from "@/lib/reservation";
import { PLAN_ACTIVITY_PHOTOS, PlanDetails, type PlanDetailsProps } from "./plan-panel";
import { PlanActions, type PlanContinueAction } from "./plan-actions";

interface MobilePlanDockProps extends PlanDetailsProps {
  activity: ActivityId;
  whenLabel: string;
  continueAction?: PlanContinueAction;
  secondaryAction?: PlanContinueAction;
}

/** Sticky within the booking area so the footer scrolls into view unobstructed. */
export function MobilePlanDock({ activity, whenLabel, continueAction, secondaryAction, ...details }: MobilePlanDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const continueAfterClose = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);

  // The sheet is portaled outside the dock. Close it if CSS hides the dock on desktop.
  useEffect(() => {
    const dock = dockRef.current;
    if (!open || !dock) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.contentRect.width === 0) setOpen(false);
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, [open]);

  function choose(action: PlanContinueAction) {
    if (action.disabled) return;
    continueAfterClose.current = action.onClick;
    setOpen(false);
  }

  return (
    <div ref={dockRef} className="sticky bottom-0 z-10 grid items-center border-t border-line-on-ink bg-ink px-gutter pb-[env(safe-area-inset-bottom)] text-dust sm:flex sm:gap-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dust sm:gap-3">
          <Image src={PLAN_ACTIVITY_PHOTOS[activity].photo} alt="" width={40} height={40} className="size-10 shrink-0 object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Tavo pasirinkimas</span>
            <span className="block text-xs text-dust/80">{whenLabel}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 sm:gap-3">
            <span aria-live="polite" className="font-display text-figure font-bold">
              <span className="sr-only">Preliminari kaina: </span>{details.total} €
            </span>
            <CaretUpIcon aria-hidden className="size-5" />
          </span>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            const proceed = continueAfterClose.current;
            if (!proceed) return;
            continueAfterClose.current = null;
            event.preventDefault();
            proceed();
          }}
          className="theme-reservation max-h-[85dvh] gap-0 border-line bg-dust pb-[env(safe-area-inset-bottom)] text-ink motion-reduce:animate-none! motion-reduce:transition-none!"
        >
          <SheetHeader className="shrink-0 flex-row items-center justify-between gap-3 border-b border-line px-gutter py-3">
            <SheetTitle className="text-heading! text-ink">Tavo pasirinkimas</SheetTitle>
            <SheetDescription className="sr-only">Pasirinktos veiklos, jų datos, laikai ir preliminari kaina.</SheetDescription>
            <SheetClose type="button" aria-label="Uždaryti planą" className="grid size-11 shrink-0 place-items-center border border-line hover:border-ink">
              <XIcon aria-hidden className="size-5" />
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-gutter py-5">
            <PlanDetails {...details} />
          </div>
          {continueAction ? (
            <SheetFooter className="shrink-0 px-gutter py-3">
              <PlanActions
                continueAction={{ ...continueAction, onClick: () => choose(continueAction) }}
                secondaryAction={secondaryAction ? { ...secondaryAction, onClick: () => choose(secondaryAction) } : undefined}
              />
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
      {continueAction ? (
        <PlanActions continueAction={continueAction} secondaryAction={secondaryAction} tone="cream" className="mb-2 sm:my-2 sm:w-64 sm:shrink-0" />
      ) : null}
    </div>
  );
}
