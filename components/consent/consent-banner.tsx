"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CONSENT_CATEGORIES } from "./consent-categories";

interface ConsentBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}

/** The policy the banner links to stays usable while the choice is open: a visitor must be able to read it before deciding. */
const READABLE_PATHS = ["/privatumo-politika"];

/**
 * First-visit prompt. "Tik būtini" and "Priimti visus" look the same: refusing must be as easy as accepting.
 * It is modal: a backdrop covers the page and the page is made inert (no clicks, no tabbing, no reading by assistive
 * technology) until a choice is made. It is rendered into `<body>` so nothing in the page can sit above it.
 */
export function ConsentBanner({
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: ConsentBannerProps) {
  const pathname = usePathname();
  const blocking = !READABLE_PATHS.some((path) => pathname.startsWith(path));
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const wanted = CONSENT_CATEGORIES.map(({ noun }) => noun).join(" ir ");

  useEffect(() => {
    if (!blocking) return;
    const root = rootRef.current;
    if (!root) return;
    // Everything else in <body> is switched off; the settings dialog opens later, so it is not affected.
    const frozen = [...document.body.children].filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== root && !el.hasAttribute("inert"),
    );
    for (const el of frozen) el.setAttribute("inert", "");
    document.body.classList.add("overflow-hidden");
    dialogRef.current?.focus();
    return () => {
      for (const el of frozen) el.removeAttribute("inert");
      document.body.classList.remove("overflow-hidden");
    };
  }, [blocking]);

  return createPortal(
    <div ref={rootRef}>
      {blocking ? (
        <div aria-hidden className="fixed inset-0 z-50 bg-ink/60" />
      ) : null}
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal={blocking}
        aria-label="Slapukų sutikimas"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-dust px-gutter py-4 text-ink shadow-lg outline-none"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-1">
            <p className="text-sm font-bold">Slapukai</p>
            <p className="text-xs leading-relaxed text-copy">
              Svetainei veikti naudojame būtinus slapukus. Jei sutinki,
              įjungsime ir {wanted}. Pasirinkimą gali pakeisti bet kada.{" "}
              <Link
                href="/privatumo-politika"
                className="underline underline-offset-2 hover:text-rust"
              >
                Privatumo politika
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onCustomize}
              className="order-last col-span-2 sm:order-first sm:col-span-1"
            >
              Nustatymai
            </Button>
            <Button type="button" onClick={onRejectAll}>
              Tik būtini
            </Button>
            <Button type="button" onClick={onAcceptAll}>
              Priimti visus
            </Button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
