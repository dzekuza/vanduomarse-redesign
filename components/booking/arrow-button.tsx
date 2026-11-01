import { Cta } from "@/components/cta";

/** The primary form button: dark block, label left, arrow right (same `Cta` as the home page). */
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
    <Cta tone="dark" small type={type} onClick={onClick} disabled={disabled}>
      {children}
    </Cta>
  );
}
