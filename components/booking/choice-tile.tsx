interface ChoiceTileProps {
  primary: string;
  secondary: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** Selectable two-line tile used by the start time and duration pickers. */
export function ChoiceTile({ primary, secondary, active, disabled, onClick }: ChoiceTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-0.5 border px-1 py-2.5 text-xs sm:py-3 sm:text-sm transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${
        disabled
          ? "cursor-not-allowed border-line text-ink/40"
          : active
            ? "border-ink bg-ink text-dust"
            : "border-line text-ink hover:border-ink"
      }`}
    >
      <span className={`font-bold ${disabled ? "line-through" : ""}`}>{primary}</span>
      <span className={active ? "text-dust/70" : disabled ? "" : "text-copy"}>{secondary}</span>
    </button>
  );
}
