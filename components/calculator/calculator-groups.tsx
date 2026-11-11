"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { StepFrame } from "@/components/booking/stepped";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CALCULATOR_SECTIONS } from "./calculator-sections";
import { EntertainmentSection } from "./entertainment-section";
import { FoodSection } from "./food-section";
import { StaySection } from "./stay-section";
import type { EventCalculatorState } from "./use-event-calculator";

interface Group {
  id: string;
  title: string;
  /** Ids from `GROUP_SECTIONS`, in order. */
  sections: string[];
}

const GROUP_SECTIONS: typeof CALCULATOR_SECTIONS = [
  ...CALCULATOR_SECTIONS,
  { id: "food", label: "Maistas", Section: FoodSection },
  { id: "entertainment", label: "Pramogos", Section: EntertainmentSection },
  { id: "overnight", label: "Nameliai", Section: ({ calc }) => <StaySection calc={calc} category="overnight" /> },
];

/** The standalone calculator's questions, grouped by topic. */
const GROUPS: Group[] = [
  { id: "proga", title: "Vieta ir laikas", sections: ["type", "guests", "space"] },
  { id: "skoniai", title: "Maistas", sections: ["food"] },
  { id: "pramogos", title: "Pramogos", sections: ["entertainment"] },
  { id: "pasiliekam", title: "Nakvynė", sections: ["overnight"] },
];

/**
 * Four numbered accordion chapters holding the calculator sections, the first open by default.
 * They open and close independently (`multiple`): a single-open accordion collapses the chapter
 * above while the new one expands, which shifts the page under the cursor and made it jump.
 */
export function CalculatorGroups({ calc, compact }: { calc: EventCalculatorState; compact?: boolean }) {
  const [open, setOpen] = useState<string[]>([GROUPS[0].id]);

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="border-b border-line">
      {GROUPS.map((group, i) => (
        <AccordionItem key={group.id} id={`calc-group-${group.id}`} value={group.id} className={cn("border-b-0 border-t border-line", compact && "first:border-t-0")}>
          <AccordionTrigger className={cn("min-h-11 items-center", compact ? "gap-2 py-3" : "gap-4 py-6")}>
            {compact ? null : <span className="shrink-0 text-micro font-normal tracking-normal">{String(i + 1).padStart(2, "0")}</span>}
            <span className={cn("font-display font-bold", compact ? "text-item" : "text-tile uppercase")}>{group.title}</span>
            <PlusIcon aria-hidden className="ml-auto size-6 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong group-data-[state=open]/trigger:rotate-45" />
          </AccordionTrigger>
          <AccordionContent className={compact ? "space-y-5 pb-5" : "space-y-10 pb-8"}>
            <StepFrame>
              {group.sections.map((sectionId) => {
                const section = GROUP_SECTIONS.find((s) => s.id === sectionId);
                if (!section) return null;
                const { Section, label } = section;
                return (
                  <div key={sectionId}>
                    {/* The date and guest controls arrange their own headings. */}
                    {group.sections.length > 1 && sectionId !== "guests" ? <OptionGroupLabel>{label}</OptionGroupLabel> : null}
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
