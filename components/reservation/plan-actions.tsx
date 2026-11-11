import type { Ref } from "react";
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
  continueRef?: Ref<HTMLButtonElement>;
  secondaryRef?: Ref<HTMLButtonElement>;
  tone?: "dark" | "cream";
  className?: string;
}

export const PLAN_PRIMARY_CLASS = "relative w-full justify-center px-12 text-center [&>svg]:absolute [&>svg]:right-4";

/** The same primary reservation and outlined pay-on-site choice in every plan surface. */
export function PlanActions({ continueAction, secondaryAction, continueRef, secondaryRef, tone = "dark", className }: PlanActionsProps) {
  return (
    <div className={cn("grid w-full gap-2", className)}>
      <Cta ref={continueRef} tone={tone} small className={PLAN_PRIMARY_CLASS} disabled={continueAction.disabled} onClick={continueAction.onClick}>
        {continueAction.label ?? "Toliau"}
      </Cta>
      {secondaryAction ? (
        <Button
          ref={secondaryRef}
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
