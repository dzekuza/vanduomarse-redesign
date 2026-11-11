import { Cta } from "@/components/cta";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { PhoneHelp } from "@/components/phone-help";

/** Side panel of the events page: sends visitors planning their own celebration to the price calculator. */
export function EventsAside() {
  return (
    <Panel as="aside" aria-label="Tavo renginys" className="space-y-6 sm:p-8 lg:sticky lg:top-32 lg:self-start">
      <Eyebrow>Tavo renginys</Eyebrow>
      <h2 className="text-tile font-bold">Ieškai erdvės savo renginiui?</h2>
      <p className="text-xs leading-loose text-copy">Pasirink tipą, svečių skaičių ir erdvę, o preliminarią kainą pamatysi iškart.</p>
      <Cta tone="coral" href="/skaiciuokle" className="w-full">
        Apskaičiuok kainą
      </Cta>
      <PhoneHelp />
    </Panel>
  );
}
