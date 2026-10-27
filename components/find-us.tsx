import { GiftIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MAPS_URL } from "@/lib/contacts";
import { COUPON_VALID_MONTHS } from "@/lib/coupons";

export function FindUs() {
  return (
    <section className="px-6 pb-16 md:px-10 md:pb-24">
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-4 rounded-tile bg-card px-6 py-6 transition-colors hover:bg-foam"
        >
          <MapPinIcon size={28} className="shrink-0 text-rust" />
          <div>
            <p className="font-display text-lg font-bold">Kaip mus rasti</p>
            <p className="mt-1 text-sm text-ink/70">Atidaryti žemėlapyje, prie ežero kranto.</p>
          </div>
        </a>
        <Link href="/kuponai" className="group flex items-start gap-4 rounded-tile bg-card px-6 py-6 transition-colors hover:bg-foam">
          <GiftIcon size={28} className="shrink-0 text-rust" />
          <div>
            <p className="font-display text-lg font-bold">Dovanų kuponai</p>
            <p className="mt-1 text-sm text-ink/70">Padovanok dieną Marse. Kuponas galioja {COUPON_VALID_MONTHS} mėn.</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
