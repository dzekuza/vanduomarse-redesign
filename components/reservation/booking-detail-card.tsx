import type { ReactNode } from "react";

interface BookingDetailCardProps {
  eyebrow: string;
  title: string;
  description?: string;
  price: string;
  selected: boolean;
  details?: ReactNode;
  onSelect?: () => void;
  children?: ReactNode;
}

/** Shared surface for booking choices with an optional details control. */
export function BookingDetailCard({
  eyebrow, title, description, price, selected, details, onSelect, children,
}: BookingDetailCardProps) {
  const copy = selected ? "text-dust/80" : "text-copy";

  return (
    <article aria-label={title} className={`relative isolate flex flex-col gap-4 border p-5 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : "border-line bg-card"} ${onSelect ? "hover:border-ink" : ""}`}>
      {onSelect ? (
        <button
          type="button"
          aria-label={`Pasirinkti: ${title}`}
          aria-pressed={selected}
          onClick={onSelect}
          className="absolute inset-0 min-h-11 w-full cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
        />
      ) : null}
      {details ? <div className="absolute top-2 right-2 z-10">{details}</div> : null}
      <div className="space-y-2">
        <p className={`text-micro uppercase ${copy} ${details ? "pr-9" : ""}`}>{eyebrow}</p>
        <h3 className={`text-item font-bold ${details ? "pr-7" : ""}`}>{title}</h3>
        {description ? <p className={`text-xs leading-relaxed ${copy}`}>{description}</p> : null}
        <p className="text-xs font-bold">{price}</p>
      </div>
      {children}
    </article>
  );
}
