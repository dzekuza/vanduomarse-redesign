"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { StepFrame } from "@/components/booking/stepped";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CALCULATOR_SECTIONS, PartySection, WhenSection } from "./calculator-sections";
import { CampActivities } from "./camp-activities";
import { CampMeals } from "./camp-meals";
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
  { id: "party", label: "Svečių skaičius", Section: PartySection },
  { id: "when", label: "Data ir laikas", Section: WhenSection },
  { id: "type-first", label: "Renginio tipas", Section: CALCULATOR_SECTIONS.find((s) => s.id === "type")!.Section },
  { id: "camp-activities", label: "Veiklos", Section: ({ calc }) => <CampActivities calc={calc} /> },
  { id: "camp-meals", label: "Maitinimas", Section: ({ calc }) => <CampMeals calc={calc} /> },
  { id: "food", label: "Maistas", Section: FoodSection },
  { id: "entertainment", label: "Pramogos", Section: EntertainmentSection },
  { id: "overnight", label: "Nameliai", Section: ({ calc }) => <StaySection calc={calc} category="overnight" /> },
];

/** The standalone calculator's questions, grouped by topic. */
const GROUPS: Group[] = [
  { id: "proga", title: "Vieta ir laikas", sections: ["type-first", "party", "space", "when"] },
  { id: "skoniai", title: "Maistas", sections: ["food"] },
  { id: "pramogos", title: "Pramogos", sections: ["entertainment"] },
  { id: "pasiliekam", title: "Nakvynė", sections: ["overnight"] },
];

/** A camp is its own short flow: people, date and days, cabins, the dome, activities and meals. No drinks, no service. */
const CAMP_GROUPS: Group[] = [
  { id: "stovykla", title: "Stovykla", sections: ["type-first", "party", "when"] },
  { id: "stovykla-nakvyne", title: "Nakvynė", sections: ["overnight"] },
  { id: "stovykla-erdve", title: "Erdvė", sections: ["space"] },
  { id: "stovykla-veiklos", title: "Veiklos", sections: ["camp-activities"] },
  { id: "stovykla-maistas", title: "Maitinimas", sections: ["camp-meals"] },
];

/**
 * Four numbered accordion chapters holding the calculator sections, the first open by default.
 * They open and close independently (`multiple`): a single-open accordion collapses the chapter
 * above while the new one expands, which shifts the page under the cursor and made it jump.
 */
export function CalculatorGroups({ calc, compact }: { calc: EventCalculatorState; compact?: boolean }) {
  const [open, setOpen] = useState<string[]>(compact ? [GROUPS[0].id, CAMP_GROUPS[0].id] : [...GROUPS, ...CAMP_GROUPS].map((g) => g.id));
  const groups = calc.input.preset === "stovykla" ? CAMP_GROUPS : GROUPS;

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="border-b border-line">
      {groups.map((group, i) => (
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
                    {group.sections.length > 1 && !["guests", "party", "when"].includes(sectionId) ? <OptionGroupLabel>{label}</OptionGroupLabel> : null}
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
