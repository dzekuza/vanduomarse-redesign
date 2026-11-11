import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { PARK_ADDRESS } from "@/components/landing/content";
import { Cta } from "@/components/cta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";
import type { QuadTourAccessory } from "@/lib/quads";

const QUESTIONS = [
  {
    question: "Ar galiu vairuoti?",
    answer: "Vairuotojui reikia B arba TR1 kategorijos pažymėjimo. Turėk asmens dokumentą.",
  },
  {
    question: "Ar galima važiuoti dviese?",
    answer: "Rinkis dvivietį keturratį. Keleiviams rekomenduojamas amžius nuo 12 metų.",
  },
  {
    question: "Kada atvykti?",
    answer: "Atvyk 20 minučių iki starto. Prieš išvykstant instruktorius supažindins su keturračiu.",
  },
  {
    question: "Kaip apsirengti?",
    answer: "Rinkis orui tinkamus, purvo nebijančius drabužius ir tvirtą avalynę. Pasiimk atsarginių drabužių.",
  },
];

/** Practical route information shared by the booking page and activity dialog. */
export function QuadInformation({ accessories }: { accessories: readonly QuadTourAccessory[] }) {
  return (
    <div className="space-y-8">
      <section className="border-t border-line pt-6">
        <p className="text-micro uppercase text-copy">Prieš startą</p>
        <h2 className="mt-3 text-heading font-bold">Susitinkam Marse.</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 border border-line p-5">
            <h3 className="text-sm font-bold">Išvykimo vieta</h3>
            <a href={MAPS_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center text-xs leading-relaxed text-copy underline underline-offset-4 hover:text-ink">
              {PARK_ADDRESS.compact}
            </a>
          </div>
          <div className="space-y-2 border border-line p-5">
            <h3 className="text-sm font-bold">Kartu smagiau</h3>
            <p className="text-xs leading-relaxed text-copy">Kelią rodo gidas. Mažiausią keturračių skaičių matysi pasirinkęs trasą.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-micro uppercase text-copy">Apranga ir priedai</h3>
        <p className="text-xs leading-relaxed text-copy">Šalmas įskaičiuotas.</p>
        <dl className="divide-y divide-line border-y border-line">
          {accessories.map((accessory) => (
            <div key={accessory.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <dt className="min-w-0 text-copy">{accessory.name}</dt>
              <dd className="shrink-0 font-bold">{accessory.price} € / vnt.</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3 border border-line p-5">
        <p className="text-micro uppercase text-rust-ink">Po saulėlydžio</p>
        <h3 className="text-item font-bold">Naktinis turas?</h3>
        <p className="text-xs leading-relaxed text-copy">Dėl važiavimo sutemus susitark iš anksto.</p>
        <Cta tone="dark" small href={telHref(MAIN_CONTACT.phone)}>Pasikalbam</Cta>
      </section>

      <section className="space-y-3">
        <h3 className="text-micro uppercase text-copy">Prieš išvykstant</h3>
        <Accordion type="single" collapsible className="border-t border-line">
          {QUESTIONS.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`quad-question-${index}`} className="border-line">
              <AccordionTrigger className="justify-between gap-4 text-sm font-bold">
                {question}
                <PlusIcon aria-hidden className="size-5 shrink-0 transition-transform duration-150 group-data-[state=open]/trigger:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-copy">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
