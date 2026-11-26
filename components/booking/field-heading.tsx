import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Heading of a form field or option group, as on the reservation page: a small icon and a bold line. Use `as="legend"` inside a fieldset. */
export function FieldHeading({ icon: Glyph, as: Tag = "p", className, children }: { icon: Icon; as?: "p" | "legend"; className?: string; children: ReactNode }) {
  return (
    <Tag className={cn("mb-3 flex items-center gap-2 text-sm font-bold", className)}>
      <Glyph size={18} aria-hidden />
      {children}
    </Tag>
  );
}
