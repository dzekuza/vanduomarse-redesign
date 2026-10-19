"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { NAV_LINKS } from "./nav-links";

/** Menu button + full-width panel under the sticky header, below the lg breakpoint. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Uždaryti meniu" : "Atidaryti meniu"}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center border border-ink transition-transform active:scale-95"
      >
        {open ? <XIcon size={22} /> : <ListIcon size={22} />}
      </button>
      {open ? (
        <nav id={panelId} className="absolute inset-x-0 top-full border-b border-ink bg-dust px-6 pb-6 md:px-10">
          <ul className="divide-y divide-ink/20">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display flex min-h-14 items-center text-lg font-bold hover:text-rust"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
