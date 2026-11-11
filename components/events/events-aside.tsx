import { Cta } from "@/components/cta";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { ServiceBookingHelp } from "@/components/services/service-booking-help";
import { MAIN_CONTACT } from "@/lib/contacts";

/** Side panel of the events page: sends visitors planning their own celebration to the price calculator. */
export function EventsAside() {
  return (
    <Panel as="aside" aria-label="Savo renginys" className="space-y-6 sm:p-8 lg:sticky lg:top-32 lg:self-start">
      <Eyebrow>Savo renginys</Eyebrow>
      <h2 className="text-tile font-bold">Planuoji savo šventę</h2>
      <p className="text-xs leading-loose text-copy">Pasirink tipą, svečių skaičių ir erdvę, o preliminarią kainą pamatysi iškart.</p>
      <div>
        <Cta tone="coral" href="/skaiciuokle" className="w-full">
          Apskaičiuok kainą
        </Cta>
        <ServiceBookingHelp contact={MAIN_CONTACT} />
      </div>
    </Panel>
  );
}
