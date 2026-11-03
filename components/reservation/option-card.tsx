"use client";

interface OptionCardProps {
  eyebrow?: string;
  title: string;
  text?: string;
  /** Price or fact line at the bottom, e.g. "20 € / val.". */
  meta?: string;
  selected: boolean;
  disabled?: boolean;
  /** `radio` picks one of a group, `check` toggles on its own. */
  indicator?: "radio" | "check";
  onClick: () => void;
}

/** Choice card of the reservation steps: dark when picked, with a coral radio or check mark. */
export function OptionCard({ eyebrow, title, text, meta, selected, disabled, indicator = "radio", onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex min-h-11 w-full flex-col gap-2 border p-5 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 ${
        disabled ? "cursor-not-allowed border-line text-ink/30" : selected ? "border-ink bg-ink text-dust" : "border-line hover:border-ink"
      }`}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="text-micro uppercase">{eyebrow}</span>
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center border ${indicator === "radio" ? "rounded-full" : ""} ${selected ? "border-rust" : "border-line"}`}
        >
          {selected ? <span className={`size-3 bg-rust ${indicator === "radio" ? "rounded-full" : ""}`} /> : null}
        </span>
      </span>
      <span className="text-item font-bold">{title}</span>
      {text ? <span className={`text-xs leading-relaxed ${selected ? "text-dust/75" : disabled ? "" : "text-ink/65"}`}>{text}</span> : null}
      {meta ? <span className="mt-auto pt-2 text-xs font-bold">{meta}</span> : null}
    </button>
  );
}

/** Small uppercase label above a group of options. */
export function OptionGroupLabel({ children }: { children: string }) {
  return <p className="mb-3 text-micro uppercase text-ink/70">{children}</p>;
}
