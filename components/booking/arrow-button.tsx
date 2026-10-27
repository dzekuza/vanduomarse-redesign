import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

/** The live-site CTA: dark block, thin arrow, uppercase label. */
export function ArrowButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-4 border border-ink bg-ink px-5 py-3 text-sm uppercase text-foam transition-[color,background-color,border-color,transform] active:scale-[0.97] enabled:hover:border-rust enabled:hover:bg-rust disabled:opacity-30"
    >
      <ArrowRightIcon size={22} weight="thin" className="transition-transform group-enabled:group-hover:translate-x-1" />
      {children}
    </button>
  );
}
