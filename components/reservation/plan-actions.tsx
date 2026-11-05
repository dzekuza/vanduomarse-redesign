import { Cta } from "@/components/cta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlanContinueAction {
  disabled: boolean;
  onClick: () => void;
  label?: string;
}

interface PlanActionsProps {
  continueAction: PlanContinueAction;
  secondaryAction?: PlanContinueAction;
  tone?: "dark" | "cream";
  className?: string;
}

/** The same primary reservation and outlined pay-on-site choice in every plan surface. */
export function PlanActions({ continueAction, secondaryAction, tone = "dark", className }: PlanActionsProps) {
  return (
    <div className={cn("grid w-full gap-2", className)}>
      <Cta tone={tone} small className="relative w-full justify-center px-12 text-center [&>svg]:absolute [&>svg]:right-4" disabled={continueAction.disabled} onClick={continueAction.onClick}>
        {continueAction.label ?? "Toliau"}
      </Cta>
      {secondaryAction ? (
        <Button
          type="button"
          variant="outline"
          disabled={secondaryAction.disabled}
          onClick={secondaryAction.onClick}
          className={cn(
            "h-auto min-h-11 w-full rounded-none bg-transparent px-4 py-3 text-center text-xs leading-snug whitespace-normal",
            tone === "cream" ? "border-dust text-dust hover:bg-dust/10 hover:text-dust" : "border-ink text-ink hover:bg-ink/5 hover:text-ink",
          )}
        >
          {secondaryAction.label ?? "Atsiskaitysiu vietoj grynais"}
        </Button>
      ) : null}
    </div>
  );
}
