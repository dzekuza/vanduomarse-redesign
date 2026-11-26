"use client";

import { ArrowRightIcon, BuildingsIcon, ConfettiIcon, ForkKnifeIcon, HouseIcon, PlusIcon, SparkleIcon, type Icon } from "@phosphor-icons/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useState } from "react";
import { FieldHeading } from "@/components/booking/field-heading";
import { StepFrame } from "@/components/booking/stepped";
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
  { id: "party", label: "Asmenų skaičius", Section: PartySection },
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

const SECTION_ICON: Record<string, Icon> = {
  "type-first": ConfettiIcon,
  type: ConfettiIcon,
  space: BuildingsIcon,
  overnight: HouseIcon,
  food: ForkKnifeIcon,
  "camp-meals": ForkKnifeIcon,
  "camp-activities": SparkleIcon,
  entertainment: SparkleIcon,
};

/** The sections of one group, with a heading above each when the group holds several. */
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
            {(group.sections.length > 1 || sectionId === "type-first") && !["guests", "party", "when"].includes(sectionId) ? <FieldHeading icon={SECTION_ICON[sectionId] ?? SparkleIcon}>{label}</FieldHeading> : null}
            <Section calc={calc} />
          </div>
        );
      })}
    </StepFrame>
  );
}

/** Segmented tabs: equal-width cells on a tinted band, the active one on the card colour with an ink bar under it. */
const TAB =
  "group/tab flex min-h-11 min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 border-b-2 border-transparent px-0.5 py-2 text-center text-xs leading-tight font-bold text-copy transition-[color,background-color,border-color] duration-150 ease-out-strong hover:text-ink disabled:cursor-not-allowed disabled:text-copy/40 disabled:hover:text-copy/40 data-[state=active]:border-ink data-[state=active]:bg-foam data-[state=active]:text-ink sm:px-3 sm:text-sm";

/** The page's questions as tabs (one group at a time) with a "Toliau" button at the end of each. Until an event type is chosen only the type shows and the other tabs wait. */
function TabbedGroups({ calc, groups }: { calc: EventCalculatorState; groups: Group[] }) {
  const [tab, setTab] = useState(groups[0].id);
  const typeChosen = calc.input.preset !== null;
  const current = groups.some((g) => g.id === tab) ? tab : groups[0].id;
  const index = groups.findIndex((g) => g.id === current);
  const next = typeChosen ? groups[index + 1] : undefined;

  return (
    <TabsPrimitive.Root value={current} onValueChange={setTab}>
      <TabsPrimitive.List aria-label="Skaičiuoklės dalys" className="flex bg-dust-soft">
        {groups.map((group, i) => (
          <TabsPrimitive.Trigger key={group.id} value={group.id} disabled={!typeChosen && i > 0} className={TAB}>
            <span className="hidden text-ink group-data-[state=active]/tab:text-rust sm:inline">{String(i + 1).padStart(2, "0")}</span>
            {group.title}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      <div className="border border-t-0 border-line bg-foam p-4 sm:p-6">
      {groups.map((group, i) => (
        <TabsPrimitive.Content key={group.id} value={group.id} id={`calc-group-${group.id}`} className="space-y-8 outline-none">
          {!typeChosen && i === 0 ? (
            <GroupSectionsView group={{ ...group, sections: ["type-first"] }} calc={calc} />
          ) : (
            <GroupSectionsView group={group} calc={calc} />
          )}
          {next && i === index ? (
            <div className="flex justify-end border-t border-line pt-4">
              <button type="button" onClick={() => setTab(next.id)} className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-xs font-bold transition-colors duration-150 hover:bg-ink hover:text-dust">
                Toliau: {next.title}
                <ArrowRightIcon aria-hidden className="size-4" />
              </button>
            </div>
          ) : null}
        </TabsPrimitive.Content>
      ))}
      </div>
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
