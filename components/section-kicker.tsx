import { cn } from "@/lib/utils";

/** Small numbered label row above a section heading. */
export function SectionKicker({ left, right, className }: { left: string; right?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-5 text-micro", className)}>
      <span>{left}</span>
      {right ? <span className="max-w-37.5 text-right md:max-w-none">{right}</span> : null}
    </div>
  );
}
