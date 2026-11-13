"use client";

import type { ReactNode } from "react";
import { RIDE_PLAN_GROUPS } from "@/lib/ride-plans";
import type { RidePlanCategory } from "@/lib/admin/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlanGroupTabsProps {
  /** Plans per category, shown as a count in the tab label. */
  counts: ReadonlyMap<RidePlanCategory, number>;
  /** Leave out tabs whose category has no plans (the till); the catalogue keeps them so plans can be added. */
  hideEmpty?: boolean;
  /** One row of tabs, one per section (Bilietai, Abonementai, Įranga), without the Plaukimas parent. */
  flat?: boolean;
  children: (category: RidePlanCategory) => ReactNode;
}

const labelWithCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

/** Plaukimas (Bilietai, Abonementai) and Įranga: top tabs per group (or one flat row), sub-tabs only where a group has more than one section. */
export function PlanGroupTabs({ counts, hideEmpty = false, flat = false, children }: PlanGroupTabsProps) {
  const groups = RIDE_PLAN_GROUPS.map((group) => {
    const sections = group.sections.filter((s) => !hideEmpty || (counts.get(s.category) ?? 0) > 0);
    return { label: group.label, sections, count: sections.reduce((sum, s) => sum + (counts.get(s.category) ?? 0), 0) };
  }).filter((group) => group.sections.length > 0);

  if (groups.length === 0) return null;

  if (flat) {
    const sections = groups.flatMap((group) => group.sections);
    return (
      <Tabs defaultValue={sections[0].category}>
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
          {sections.map((section) => (
            <TabsTrigger key={section.category} value={section.category} className="min-h-11 shrink-0">
              {labelWithCount(section.label, counts.get(section.category) ?? 0)}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.category} value={section.category} className="mt-4">
            {children(section.category)}
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <Tabs defaultValue={groups[0].label}>
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
        {groups.map((group) => (
          <TabsTrigger key={group.label} value={group.label} className="min-h-11 shrink-0">
            {labelWithCount(group.label, group.count)}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group.label} value={group.label} className="mt-4">
          {group.sections.length === 1 ? (
            children(group.sections[0].category)
          ) : (
            <Tabs defaultValue={group.sections[0].category}>
              <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
                {group.sections.map((section) => (
                  <TabsTrigger key={section.category} value={section.category} className="min-h-11 shrink-0">
                    {labelWithCount(section.label, counts.get(section.category) ?? 0)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {group.sections.map((section) => (
                <TabsContent key={section.category} value={section.category} className="mt-4">
                  {children(section.category)}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
