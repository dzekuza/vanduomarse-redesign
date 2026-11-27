import Image from "next/image";

export function WakeBlackFridayArtwork({ price, percent }: { price: string; percent: number }) {
  return (
    <div className="relative isolate grid aspect-video max-h-48 w-full place-content-center gap-3 overflow-hidden bg-ink px-3 text-center text-foam">
      <Image src="/landing/wake-dusk.webp" alt="" fill loading="eager" sizes="(min-width: 1024px) 33vw, 100vw" className="-z-20 object-cover grayscale" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/75" />
      <p className="text-heading leading-none font-bold uppercase">Black Friday<br />pasiūlymas</p>
      <div className="space-y-1">
        <p className="text-micro font-bold uppercase">Metinis WAKE abonementas</p>
        <p className="inline-block bg-rust px-2 py-1 text-sm font-bold text-on-rust">−{percent} % nuo {price}</p>
      </div>
      <p className="text-xs">Įsigyk iki gruodžio 1 d. ir mokėk dalimis: pusę dabar, o likusią sumą prieš sezono pradžią.</p>
    </div>
  );
}
