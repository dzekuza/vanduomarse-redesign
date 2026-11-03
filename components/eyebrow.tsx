import type { ElementType, ReactNode } from "react";

/**
 * Small uppercase label: above a group of options, a panel heading or a tag. Muted by default.
 * Built with a plain template, not `cn()`: its merger mistakes the custom `text-micro` size for a colour and drops one.
 */
export function Eyebrow({ as: Tag = "p", className = "", children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={`text-micro uppercase text-muted-foreground ${className}`}>{children}</Tag>;
}
