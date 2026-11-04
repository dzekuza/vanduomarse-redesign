"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface AccordionRow {
  id: string;
  title: string;
  body: string;
  /** Small index shown before the title. */
  index?: string;
}

interface LandingAccordionProps {
  rows: readonly AccordionRow[];
  /** `events` = big bold rows on coral; `faq` = small rows. */
  variant: "events" | "faq";
  /** `single` keeps one row open (first by default); `multiple` lets several stay open. */
  mode: "single" | "multiple";
}

/** Bordered accordion rows with a plus that turns into a cross. */
export function LandingAccordion({ rows, variant, mode }: LandingAccordionProps) {
  const events = variant === "events";
  const shared = {
    className: cn("border-t", events ? "border-ink/40 last:border-b" : "border-line last:border-b"),
  };
  const items = rows.map((row) => (
    <AccordionItem key={row.id} value={row.id} className={cn("border-b-0", shared.className)}>
      <AccordionTrigger
        className={cn(events ? "gap-4 py-5 text-figure font-bold tracking-tight md:py-6 md:text-heading" : "items-start gap-5 py-5 text-sm font-bold leading-snug md:text-item")}
      >
        {row.index ? <span className="text-micro font-normal tracking-normal">{row.index}</span> : null}
        <span>{row.title}</span>
        <PlusIcon aria-hidden className="ml-auto size-6 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong group-data-[state=open]/trigger:rotate-45" />
      </AccordionTrigger>
      <AccordionContent className={cn("text-xs leading-loose", events ? "px-0 pr-8 pb-6 md:pl-10" : "pr-9 pb-6 text-sm text-copy")}>
        {row.body}
      </AccordionContent>
    </AccordionItem>
  ));

  return mode === "single" ? (
    <Accordion type="single" collapsible defaultValue={rows[0]?.id}>
      {items}
    </Accordion>
  ) : (
    <Accordion type="multiple">{items}</Accordion>
  );
}
