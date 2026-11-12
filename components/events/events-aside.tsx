import { Cta } from "@/components/cta";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { MAIN_CONTACT } from "@/lib/contacts";

/** Side panel linking visitors to the celebrations page and its calculator. */
export function EventsAside() {
  return (
    <Panel as="aside" aria-label="Tavo renginys" className="space-y-6 bg-foam sm:p-8 lg:sticky lg:top-32 lg:self-start">
      <Eyebrow>Tavo renginys</Eyebrow>
      <h2 className="text-tile font-bold">Ieškai erdvės savo renginiui?</h2>
      <p className="text-xs leading-loose text-copy">Pasirink tipą, svečių skaičių ir erdvę, o preliminarią kainą pamatysi iškart.</p>
      <div>
        <Cta tone="coral" href="/sventes" className="w-full">
          Apskaičiuok kainą
        </Cta>
        <ServiceBookingHelp contact={MAIN_CONTACT} />
      </div>
    </Panel>
  );
}
