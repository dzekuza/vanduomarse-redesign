import type { ReactNode, Ref } from "react";

/** VAT-inclusive price shown above a public booking or order action. */
export function BookingPrice({ amount, label = "Iš viso, su PVM", note, labelRef }: {
  amount: ReactNode;
  label?: string;
  note?: ReactNode;
  labelRef?: Ref<HTMLParagraphElement>;
}) {
  return (
    <div>
      <p ref={labelRef} tabIndex={labelRef ? -1 : undefined} className="text-micro uppercase text-copy">{label}</p>
      <p aria-live="polite" aria-atomic="true" className="font-display text-total font-bold">{amount}</p>
      {note ? <div className="mt-1 text-xs text-copy">{note}</div> : null}
    </div>
  );
}
