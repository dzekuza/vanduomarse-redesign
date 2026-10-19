import { GiftIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";

export function FindUs() {
  return (
    <section className="bg-dust-soft px-6 py-14 md:px-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <a
          href="https://goo.gl/maps/dZJ74iwj3UiChd5FA"
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-4 border border-ink bg-foam px-6 py-6 transition-colors hover:border-rust"
        >
          <MapPinIcon size={28} className="shrink-0 text-rust" />
          <div>
            <p className="font-display text-lg font-bold">Kaip mus rasti</p>
            <p className="mt-1 text-sm text-ink/70">Atidaryti žemėlapyje, prie ežero kranto.</p>
          </div>
        </a>
        <a
          href="https://shop.vanduomarse.lt"
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-4 border border-ink bg-foam px-6 py-6 transition-colors hover:border-rust"
        >
          <GiftIcon size={28} className="shrink-0 text-rust" />
          <div>
            <p className="font-display text-lg font-bold">Dovanų kuponai</p>
            <p className="mt-1 text-sm text-ink/70">Padovanok seansą Marse, be galiojimo apribojimų.</p>
          </div>
        </a>
      </div>
    </section>
  );
}
