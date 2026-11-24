"use client";

import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useState } from "react";
import { StepFrame } from "@/components/booking/stepped";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

/** The sections of one group, with a small label above each when the group holds several. */
function GroupSectionsView({ group, calc }: { group: Group; calc: EventCalculatorState }) {
  return (
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
  );
}

/** Underlined tabs: a hairline under the whole row, an ink bar under the active tab. */
const TAB =
  "-mb-px min-h-11 border-b-2 border-transparent px-1 pb-1 text-sm font-bold text-copy transition-[color,border-color] duration-150 ease-out-strong hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink";

/** The page's questions as tabs (one group at a time) with a "Toliau" button at the end of each. */
function TabbedGroups({ calc, groups }: { calc: EventCalculatorState; groups: Group[] }) {
  const [tab, setTab] = useState(groups[0].id);
  const current = groups.some((g) => g.id === tab) ? tab : groups[0].id;
  const index = groups.findIndex((g) => g.id === current);
  const next = groups[index + 1];

  return (
    <TabsPrimitive.Root value={current} onValueChange={setTab}>
      <TabsPrimitive.List aria-label="Skaičiuoklės dalys" className="flex flex-wrap gap-x-6 border-b border-line">
        {groups.map((group, i) => (
          <TabsPrimitive.Trigger key={group.id} value={group.id} className={TAB}>
            <span className="mr-2 text-xs text-rust">{String(i + 1).padStart(2, "0")}</span>
            {group.title}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {groups.map((group) => (
        <TabsPrimitive.Content key={group.id} value={group.id} id={`calc-group-${group.id}`} className="mt-6 space-y-8 outline-none">
          <GroupSectionsView group={group} calc={calc} />
          {next ? (
            <div className="flex justify-end border-t border-line pt-4">
              <button type="button" onClick={() => setTab(next.id)} className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-xs font-bold transition-colors duration-150 hover:bg-ink hover:text-dust">
                Toliau: {next.title}
                <ArrowRightIcon aria-hidden className="size-4" />
              </button>
            </div>
          ) : null}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

/**
 * The calculator's questions in topic groups. The page shows them as tabs (`TabbedGroups`); the compact panel keeps numberless
 * accordion chapters that open and close independently (`multiple`): a single-open accordion collapses the chapter above
 * while the new one expands, which shifts the page under the cursor and made it jump.
 */
export function CalculatorGroups({ calc, compact }: { calc: EventCalculatorState; compact?: boolean }) {
  const [open, setOpen] = useState<string[]>([GROUPS[0].id, CAMP_GROUPS[0].id]);
  const groups = calc.input.preset === "stovykla" ? CAMP_GROUPS : GROUPS;
  if (!compact) return <TabbedGroups calc={calc} groups={groups} />;

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="border-b border-line">
      {groups.map((group) => (
        <AccordionItem key={group.id} id={`calc-group-${group.id}`} value={group.id} className="border-b-0 border-t border-line first:border-t-0">
          <AccordionTrigger className="min-h-11 items-center gap-2 py-3">
            <span className="font-display text-item font-bold">{group.title}</span>
            <PlusIcon aria-hidden className="ml-auto size-6 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong group-data-[state=open]/trigger:rotate-45" />
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-5">
            <GroupSectionsView group={group} calc={calc} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
