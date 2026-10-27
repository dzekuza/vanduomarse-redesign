import { cn } from "@/lib/utils";

interface WordmarkProps {
  /** `h1` on the home hero; decorative repeats (footer) pass `aria-hidden`. */
  as?: "h1" | "p";
  className?: string;
  "aria-hidden"?: boolean;
}

/** "VANDUO MARSE" in giant coral condensed caps, fitted to the container width. */
export function Wordmark({ as: Tag = "p", className, "aria-hidden": ariaHidden }: WordmarkProps) {
  return (
    <div className="wordmark-fit">
      <Tag aria-hidden={ariaHidden} className={cn("font-wordmark wordmark-size text-rust", className)}>
        <span className="block md:inline">Vanduo</span> <span className="block md:inline">Marse</span>
      </Tag>
    </div>
  );
}
