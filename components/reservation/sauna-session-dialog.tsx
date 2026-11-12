"use client";

import { useRef } from "react";
import { ArrowButton } from "@/components/booking/arrow-button";
import { CompactStepper } from "@/components/booking/stepper";
import { AvailabilityCount } from "@/components/services/availability-count";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SessionRow } from "@/lib/reservation";
import { toSaunaEvent, type SaunaEventData } from "@/lib/sauna-events";
import { DialogPhotoClose } from "./dialog-photo-close";

const sessionDate = new Intl.DateTimeFormat("lt-LT", { dateStyle: "long" });

interface SessionDetails {
  event: SaunaEventData;
  row: SessionRow;
  quantity: { value: number; max: number; onChange: (people: number) => void };
  selected: boolean;
}

export function SaunaSessionDialog({ open, details, onClose, onSelect, onSelectedFocus, actionLabel }: {
  open: boolean;
  details?: SessionDetails;
  onClose: () => void;
  onSelect: () => void;
  onSelectedFocus?: () => void;
  actionLabel?: string;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const confirmed = useRef(false);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          confirmed.current = false;
          returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
          title.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (confirmed.current && onSelectedFocus) onSelectedFocus();
          else if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
        }}
      >
        <DialogPhotoClose />
        <header className="shrink-0 space-y-2 border-b border-line p-5 pr-16 sm:p-6 sm:pr-18">
          <p className="text-micro uppercase text-copy">{details?.row.label ?? "Seansas"}</p>
          <DialogTitle ref={title} tabIndex={-1} className="font-display text-heading outline-none">
            {details?.row.title ?? "Seansas nepasiekiamas"}
          </DialogTitle>
          <DialogDescription className={details ? "sr-only" : "text-copy"}>
            {details ? "Pirties seanso informacija ir vietų pasirinkimas." : "Šio seanso rezervuoti nebegalima. Kitus seansus rasi rezervacijos kalendoriuje."}
          </DialogDescription>
        </header>
        {details ? (
          <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
            <dl className="grid grid-cols-2 gap-2">
              {([
                ["Data", sessionDate.format(toSaunaEvent(details.event).date)],
                ["Laikas", details.row.time],
                ["Vieta", details.event.venue || "Pirtis Marse"],
                ["Laisvos vietos", <AvailabilityCount key="seats" free={details.event.spotsLeft} capacity={details.event.capacity} binary />],
              ] as const).map(([label, value]) => (
                <div key={label} className="space-y-1 border border-line bg-card p-3">
                  <dt className="text-micro uppercase text-copy">{label}</dt>
                  <dd className="text-xs font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            {details.row.description || details.row.host ? (
              <section className="space-y-2 border border-line p-4">
                <h3 className="text-micro font-bold uppercase">Apie seansą</h3>
                {details.row.host ? <p className="text-xs font-bold">Pirtininkas · {details.row.host}</p> : null}
                {details.row.description ? <p className="text-xs leading-relaxed whitespace-pre-line text-copy">{details.row.description}</p> : null}
              </section>
            ) : null}
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-item font-bold">{details.row.rate}</p>
                {!details.row.blocked ? <CompactStepper label="Vietų skaičius" {...details.quantity} min={1} editable /> : null}
              </div>
              {details.row.blocked ? (
                <p className="text-xs text-rust-ink">{details.event.spotsLeft > 0 ? "Seanso laikas kertasi su tavo planu." : "Laisvų vietų nebeliko."}</p>
              ) : (
                <ArrowButton onClick={() => {
                  confirmed.current = true;
                  onSelect();
                }}>{actionLabel ?? (details.selected ? "Grįžti į planą" : "Pridėti į planą")}</ArrowButton>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
