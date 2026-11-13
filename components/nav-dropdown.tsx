"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { NavLink } from "@/components/nav-links";
import { cn } from "@/lib/utils";

const LINK_UNDERLINE =
  "relative inline-flex min-h-11 items-center after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current motion-safe:after:transition-transform motion-safe:after:duration-200 motion-safe:after:ease-out-strong hover:after:scale-x-100";

/**
 * Desktop header link with a dropdown of deep links. The link itself still goes to its page; the list
 * opens on hover, keyboard focus or the caret button, and Escape closes it.
 */
export function NavDropdown({ link }: { link: NavLink & { children: NonNullable<NavLink["children"]> } }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setOpen(false)}
    >
      <div className="flex items-center">
        <Link href={link.href} className={LINK_UNDERLINE} onClick={() => setOpen(false)}>{link.label}</Link>
        <button
          type="button"
          aria-label={`${link.label}: rodyti pasirinkimus`}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className="grid size-8 place-items-center"
        >
          <CaretDownIcon aria-hidden size={12} weight="bold" className={cn("motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")} />
        </button>
      </div>
      {/* The padding bridges the gap to the header so the pointer can travel from the link into the list. */}
      <div id={listId} hidden={!open} className="absolute top-full left-0 z-30 pt-2">
        <ul className="min-w-56 border border-line-on-ink bg-ink py-2 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150">
          {link.children.map((child) => (
            <li key={child.href}>
              <Link href={child.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center px-4 text-xs font-bold hover:bg-ink-soft hover:text-rust focus-visible:bg-ink-soft focus-visible:text-rust">
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
