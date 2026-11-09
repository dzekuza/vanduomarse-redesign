import { ActivityBoard } from "./activity-board";
import { Reveal } from "@/components/reveal";

/** `#kryptys`: heading + the filterable activity grid. */
export function LandingActivities() {
  return (
    <section id="kryptys" aria-labelledby="activities-title" className="px-gutter py-14 md:py-19">
      <Reveal>
      <div className="mb-6 md:mb-10 md:flex md:items-end md:justify-between md:gap-15">
        <h2 id="activities-title" className="text-display font-bold">
          PRAMOGOS
          <br />
          <span className="text-rust">IR POILSIS</span>
        </h2>
        <p className="mt-6 text-xs leading-loose text-copy md:mt-0 md:mb-2">
          Nuo wakeboard treniruočių ar pirties seanso iki vestuvių ar įmonės šventės. Pramogos, maistas ir nakvynė tavo kompanijai.
        </p>
      </div>
      </Reveal>
      <ActivityBoard />
    </section>
  );
}
