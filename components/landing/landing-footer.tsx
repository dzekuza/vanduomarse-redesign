import { FooterBar, FooterWord } from "@/components/site-footer";
import { Cta } from "@/components/cta";
import { Reveal } from "@/components/reveal";

/** Closing block: tagline + planner CTA, the giant "Susitinkam Marse" and the link row. */
export function LandingFooter() {
  return (
    <footer className="bg-dust px-gutter pt-14 pb-6.5 md:pt-19">
      <Reveal className="md:flex md:items-center md:justify-between md:gap-6">
        <p className="text-xs leading-loose">
          GERIAUSI PLANAI
          <br />
          PRASIDEDA NUO „VAROM“.
        </p>
        <Cta tone="dark" href="#kryptys" className="mt-5 md:mt-0">
          Rezervuok savo Marsą
        </Cta>
      </Reveal>
      <FooterWord />
      <FooterBar topHref="#pradzia" />
    </footer>
  );
}
