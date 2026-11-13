import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CONSENT_CATEGORIES } from "./consent-categories";

interface ConsentBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}

/** First-visit bar. "Tik būtini" and "Priimti visus" look the same: refusing must be as easy as accepting. */
export function ConsentBanner({ onAcceptAll, onRejectAll, onCustomize }: ConsentBannerProps) {
  const wanted = CONSENT_CATEGORIES.map(({ noun }) => noun).join(" ir ");
  return (
    <section aria-label="Slapukų sutikimas" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-dust px-gutter py-4 text-ink shadow-lg">
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-1">
          <p className="text-sm font-bold">Slapukai</p>
          <p className="text-xs leading-relaxed text-copy">
            Svetainei veikti naudojame būtinus slapukus. Jei sutinki, įjungsime ir {wanted}. Pasirinkimą gali pakeisti bet kada.{" "}
            <Link href="/privatumo-politika" className="underline underline-offset-2 hover:text-rust">Privatumo politika</Link>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button type="button" variant="ghost" onClick={onCustomize} className="order-last col-span-2 sm:order-first sm:col-span-1">Nustatymai</Button>
          <Button type="button" onClick={onRejectAll}>Tik būtini</Button>
          <Button type="button" onClick={onAcceptAll}>Priimti visus</Button>
        </div>
      </div>
    </section>
  );
}
