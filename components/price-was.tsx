import type { ReactNode } from "react";

/** The pre-sale price, struck through (`<s>`: no longer accurate, not an edit), before the current price; screen readers hear "Buvusi kaina". */
export function PriceWas({ children }: { children: ReactNode }) {
  return (
    <s className="mr-1.5 font-normal opacity-60">
      <span className="sr-only">Buvusi kaina: </span>
      {children}
    </s>
  );
}
