import { ArrowLink } from "./arrow-link";
import { CableLoop } from "./cable-loop";

export function Hero() {
  return (
    <section className="grid gap-10 px-6 pb-16 pt-4 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-6 md:px-10 md:pb-24">
      <div>
        <p className="mb-6 inline-block border border-ink px-4 py-2 text-xs uppercase">Kabelinis vandenlenčių parkas · Lietuva</p>
        <h1 className="font-display text-5xl font-bold leading-[1.02] sm:text-6xl xl:text-7xl">
          Žemė per
          <br />
          toli. Plauk
          <br />
          Marse.
        </h1>
        <p className="mt-6 max-w-md text-lg text-ink/80">
          620 metrų kabelio trasa, 6 bokštai, 17 kliūčių ežere. Vienu metu
          plaukia iki 8 raitelių, pirmąkart ar jau treniruotas.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ArrowLink href="#kainos">Žiūrėti kainas</ArrowLink>
          <a href="#zonos" className="border-b border-ink pb-0.5 text-sm uppercase hover:border-rust hover:text-rust">
            Visos zonos
          </a>
        </div>
      </div>
      <CableLoop className="w-full" />
    </section>
  );
}
