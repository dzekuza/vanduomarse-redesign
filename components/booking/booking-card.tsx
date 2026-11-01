"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Cta } from "@/components/cta";
import { StepFrame, useSteppedBooking } from "./stepped";

export interface BookingStep {
  id: string;
  /** Shown in the stepper header. */
  label: string;
  content: ReactNode;
  /** `false` blocks "Toliau" until the visitor has chosen what this step needs. */
  ready?: boolean;
}

interface BookingCardProps {
  /** Step content, all at once (phone gate and other single-screen cards). */
  children?: ReactNode;
  /** The flow as steps: all shown together on the pages, one at a time inside a `SteppedBooking`. */
  steps?: BookingStep[];
  /** Left side of the footer bar: what is selected and the running total. */
  summary: ReactNode;
  /** Right side of the footer bar, usually the confirm button. In a stepper it appears on the last step. */
  action: ReactNode;
}

const CARD = "border border-ink bg-foam";
const BAR = "flex flex-wrap items-center justify-between gap-4 border-t border-ink bg-dust-soft px-4 py-4 sm:px-8 sm:py-5";
/** Stepper bar: total on the left, Back / Next on the right, one row even on phones. */
const BAR_STEPPED = "flex items-center justify-between gap-3 border-t border-ink bg-dust-soft px-4 py-3 sm:gap-4 sm:px-8 sm:py-5";

/** Outlined booking form shell: step content on top, total and confirm bar below. */
export function BookingCard({ children, steps, summary, action }: BookingCardProps) {
  const stepped = useSteppedBooking();
  const [index, setIndex] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const shown = useRef(index);

  // Bring the card back into view only when the step really changes (not on mount, not on the dev double-run).
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    top.current?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!steps || !stepped || steps.length < 2) {
    return (
      <div className={CARD}>
        <div className="@container space-y-8 px-4 py-6 sm:px-8 sm:py-8">{steps ? steps.map((s) => <Fragment key={s.id}>{s.content}</Fragment>) : children}</div>
        <div className={BAR}>
          <div>{summary}</div>
          {action}
        </div>
      </div>
    );
  }

  const at = Math.min(index, steps.length - 1);
  const step = steps[at];
  const last = at === steps.length - 1;

  return (
    <div ref={top} className={CARD}>
      <div className="px-4 pt-6 sm:px-8 sm:pt-8">
        <div aria-hidden className="mb-5 flex gap-1.5">
          {steps.map((s, n) => (
            <span key={s.id} className={`h-0.75 flex-1 transition-colors duration-200 ${n <= at ? "bg-rust" : "bg-ink/15"}`} />
          ))}
        </div>
        <p className="flex items-baseline gap-3 text-sm font-semibold uppercase">
          <span className="font-display text-rust">{String(at + 1).padStart(2, "0")}</span>
          <span>{step.label}</span>
          <span className="ml-auto text-micro font-normal text-ink/60">
            {at + 1} / {steps.length}
          </span>
        </p>
      </div>
      <div key={step.id} className="@container space-y-8 px-4 py-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-200 motion-safe:ease-out-strong sm:px-8 sm:py-6">
        <StepFrame>{step.content}</StepFrame>
      </div>
      <div className={BAR_STEPPED}>
        <div className="min-w-0">{summary}</div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {at > 0 ? (
            <button type="button" onClick={() => setIndex(at - 1)} className="inline-flex min-h-11 items-center border-b border-current text-xs font-bold transition-opacity duration-150 active:opacity-70">
              Atgal
            </button>
          ) : (
            <span />
          )}
          {last ? (
            action
          ) : (
            <Cta tone="dark" small disabled={step.ready === false} onClick={() => setIndex(at + 1)}>
              Toliau
            </Cta>
          )}
        </div>
      </div>
    </div>
  );
}

export function BookingTotal({ note, total, discount = 0 }: { note: string; total: number; discount?: number }) {
  return (
    <>
      <p className="text-xs leading-snug text-ink/60 sm:text-sm">{note}</p>
      {discount > 0 ? <p className="text-xs text-ink/60 sm:text-sm">Kuponas −{discount} €</p> : null}
      <p className="font-display text-xl font-bold sm:text-2xl">{total} €</p>
    </>
  );
}
