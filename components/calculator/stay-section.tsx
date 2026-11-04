"use client";

import { PlusIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PRICES, formatMoney } from "@/lib/event-pricing";
import { OptionToggle } from "./option-toggle";
import type { EventCalculatorState } from "./use-event-calculator";

type StayCategory = "entertainment" | "overnight";

interface Row {
  id: string;
  category: StayCategory;
  title: string;
  blurb: string;
  /** What is chosen so far, shown on the closed row; null when nothing is. */
  chosen: string | null;
  body: ReactNode;
}

/** Sauna, quads and cabins feed the same estimate in the drawer and in their page groups. */
export function StaySection({ calc: { input, set }, category }: { calc: EventCalculatorState; category?: StayCategory }) {
  const rows: Row[] = [
    {
      id: "pirtis",
      category: "entertainment",
      title: "Pirtis",
      blurb: "Privati malkomis kūrenama pirtis prie ežero jūsų svečiams, nuo 2 val.",
      chosen: input.saunaHours > 0 ? `${Math.max(2, input.saunaHours)} val.` : null,
      body: (
        <div className="grid gap-3 @xl:grid-cols-2">
          <Stepper label="Pirtis, val. (min. 2)" value={input.saunaHours} onChange={(v) => set("saunaHours", v === 1 ? (input.saunaHours > 1 ? 0 : 2) : v)} min={0} max={8} />
          {input.saunaHours > 0 ? <OptionToggle label="Pirtininkas" hint={formatMoney(PRICES.saunaMaster)} checked={input.saunaMaster} onChange={(v) => set("saunaMaster", v)} /> : null}
        </div>
      ),
    },
    {
      id: "keturraciai",
      category: "entertainment",
      title: "Keturračiai",
      blurb: "Žygis keturračiais po Marso apylinkes su instruktoriumi.",
      chosen: input.atvRiders > 0 ? `${input.atvRiders} asm.` : null,
      body: <Stepper label={`Keturračių turas (${PRICES.atvTour} €/asm.)`} value={input.atvRiders} onChange={(v) => set("atvRiders", v)} min={0} max={100} />,
    },
    {
      id: "nakvyne",
      category: "overnight",
      title: category === "overnight" ? "Nameliai" : "Nakvynė",
      blurb: `Nameliai svečiams, ${formatMoney(PRICES.cabinNight)} asmeniui per naktį.`,
      chosen: input.cabinGuests > 0 ? `${input.cabinGuests} asm. × ${input.cabinNights} n.` : null,
      body: (
        <div className="grid gap-3 @xl:grid-cols-2">
          <Stepper label={`Nakvynė, asm. (${formatMoney(PRICES.cabinNight)})`} value={input.cabinGuests} onChange={(v) => set("cabinGuests", v)} min={0} max={PRICES.cabinBeds} />
          {input.cabinGuests > 0 ? <Stepper label="Naktys" value={input.cabinNights} onChange={(v) => set("cabinNights", v)} min={1} max={7} /> : null}
        </div>
      ),
    },
  ];
  const visibleRows = category ? rows.filter((r) => r.category === category) : rows;

  return (
    <section className="@container">
      <StepLabel step={7}>Pasiliekam Marse</StepLabel>
      {category ? null : <p className="mb-4 text-xs text-copy">Norisi pasilikti ilgiau? Atidaryk ir pridėk pirtį, keturračius ar nakvynę prie sąmatos.</p>}
      <Accordion type="multiple" className="border-b border-line">
        {visibleRows.map((r) => (
          <AccordionItem key={r.id} value={r.id} className="border-b-0 border-t border-line">
            <AccordionTrigger className="items-center gap-4 py-4">
              <span className="min-w-0">
                <span className="block text-item font-bold">{r.title}</span>
                <span className="block text-xs font-normal text-copy">{r.blurb}</span>
              </span>
              {r.chosen ? <span className="ml-auto shrink-0 border border-ink bg-ink px-2.5 py-1 text-micro text-dust">{r.chosen}</span> : <span className="ml-auto" />}
              <PlusIcon aria-hidden className="size-6 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-strong group-data-[state=open]/trigger:rotate-45" />
            </AccordionTrigger>
            <AccordionContent className="pb-6">{r.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
