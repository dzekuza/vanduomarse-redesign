"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { StepFrame } from "@/components/booking/stepped";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CALCULATOR_SECTIONS } from "./calculator-sections";
import type { EventCalculatorState } from "./use-event-calculator";

interface Group {
  id: string;
  title: string;
  /** Ids from `CALCULATOR_SECTIONS`, in order. */
  sections: string[];
}

/** The calculator's questions as three big chapters, like the planning design. */
const GROUPS: Group[] = [
  { id: "proga", title: "Proga ir vieta.", sections: ["type", "guests", "space"] },
  { id: "skoniai", title: "Skoniai ir veiksmas.", sections: ["catering", "drinks", "extras"] },
  { id: "pasiliekam", title: "Pasiliekam Marse.", sections: ["stay"] },
];

/** Three numbered accordion chapters holding the calculator sections; one open at a time, the first by default. */
export function CalculatorGroups({ calc }: { calc: EventCalculatorState }) {
  const [open, setOpen] = useState(GROUPS[0].id);
  const asked = useRef(false);

  // Opening a chapter collapses the one above it, which pulls the page up: bring the opened chapter's title back under the header once that has settled.
  useEffect(() => {
    if (!open || !asked.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => document.getElementById(`calc-group-${open}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 250);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Accordion
      type="single"
      collapsible
      value={open}
      onValueChange={(next) => {
        asked.current = true;
        setOpen(next);
      }}
      className="border-b border-line"
    >
      {GROUPS.map((group, i) => (
        <AccordionItem key={group.id} id={`calc-group-${group.id}`} value={group.id} className="scroll-mt-4 border-b-0 border-t border-line">
          <AccordionTrigger className="items-center gap-4 py-6">
            <span className="font-display text-tile font-bold text-rust">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-display text-tile font-bold">{group.title}</span>
            <PlusIcon aria-hidden className="ml-auto size-6 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong group-data-[state=open]/trigger:rotate-45" />
          </AccordionTrigger>
          <AccordionContent className="space-y-10 pb-8">
            <StepFrame>
              {group.sections.map((sectionId) => {
                const section = CALCULATOR_SECTIONS.find((s) => s.id === sectionId);
                if (!section) return null;
                const { Section, label } = section;
                return (
                  <div key={sectionId} className="space-y-3">
                    {/* The single section of a chapter has the chapter's title already. */}
                    {group.sections.length > 1 ? <p className="text-lg font-bold uppercase tracking-tight">{label}</p> : null}
                    <Section calc={calc} />
                  </div>
                );
              })}
            </StepFrame>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
