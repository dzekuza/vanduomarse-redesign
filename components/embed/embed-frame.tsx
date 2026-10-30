"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { EMBED_HEIGHT_MESSAGE, toEmbedPath } from "@/lib/embed";

/**
 * Wrapper for /embed/* pages inside an iframe. Reports the content height to the
 * parent page (the WordPress plugin resizes the iframe) and keeps internal links
 * sane: a booking route opens its embed twin in place, anything else a new tab.
 * Width follows the iframe, i.e. the block it sits in: no side padding below
 * `sm` so narrow blocks (sidebars) get the full width.
 */
export function EmbedFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) return;
    const post = () => window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, height: Math.ceil(el.getBoundingClientRect().height) }, "*");
    const observer = new ResizeObserver(post);
    observer.observe(el);
    post();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Capture phase runs before next/link's own click handler.
    const onClick = (e: MouseEvent) => {
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/embed")) return;
      e.preventDefault();
      e.stopPropagation();
      const embedded = toEmbedPath(url.pathname);
      if (embedded) router.push(`${embedded}${url.search}`);
      else window.open(url.href, "_blank", "noopener");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <div ref={ref} className="py-4 sm:px-4 sm:py-6 md:px-6">
      {children}
    </div>
  );
}
