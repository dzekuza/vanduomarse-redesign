import { CableLoop } from "./cable-loop";

export function Hero() {
  return (
    <section className="grid gap-10 px-6 pb-16 pt-4 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-6 md:px-10 md:pb-24">
      <div>
        <p className="mb-5 text-sm font-medium text-ink/60">Kabelinis vandenlenčių parkas · Lietuva</p>
        <h1 className="font-display text-[15vw] font-black leading-[0.88] tracking-tight md:text-[5.2vw]">
          Žemė per
          <br />
          toli. Plauk
          <br />
          Marse.
        </h1>
        <p className="mt-6 max-w-md text-lg text-ink/80">
          620 metrų kabelio trasa, 6 bokštai, 17 kliūčių ežere. Vienu metu
          plaukia iki 8 raitelių — pirmąkart ar jau treniruotas.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#kainos"
            className="border border-ink bg-ink px-6 py-3 text-sm font-medium text-foam transition-colors hover:bg-rust hover:border-rust"
          >
            Žiūrėti kainas
          </a>
          <a href="#zonos" className="border-b border-ink/30 pb-0.5 text-sm font-medium text-ink/80 hover:border-rust hover:text-rust">
            Visos zonos
          </a>
        </div>
      </div>
      <CableLoop className="w-full" />
    </section>
  );
}
