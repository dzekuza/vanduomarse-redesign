"use client";

import type { MouseEvent, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { saunaSessionHref } from "@/lib/sauna-events";

export function closeSessionInfo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("seansas");
  window.history.replaceState(null, "", url);
}

export function SessionInfoLink({ id, children, className }: {
  id: string;
  children: ReactNode;
  className: string;
}) {
  const href = saunaSessionHref(id, usePathname() === "/pirtis" ? "pirtis" : "rezervacija");

  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("seansas", id);
    window.history.pushState(null, "", url);
  }

  return <a href={href} aria-haspopup="dialog" onClick={open} className={className}>{children}</a>;
}
