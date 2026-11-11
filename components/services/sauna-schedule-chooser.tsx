"use client";

import { useRef, type RefObject } from "react";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { openSessionInfo } from "@/components/reservation/session-info-link";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SessionRow } from "@/lib/reservation";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { dateStyle: "long" });

export function SaunaScheduleChooser({ date, sessions, open, onOpenChange, opener }: {
  date: Date;
  sessions: readonly (SessionRow & { eventId: string })[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opener: RefObject<HTMLButtonElement | null>;
}) {
  const pendingSession = useRef<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-9/10 overflow-y-auto rounded-none border-line bg-popover p-5 text-ink sm:max-w-xl sm:p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener.current?.focus({ preventScroll: true });
          if (pendingSession.current) {
            openSessionInfo(pendingSession.current);
            pendingSession.current = null;
          }
        }}
      >
        <DialogPhotoClose />
        <div className="space-y-1 pr-12">
          <DialogTitle className="font-display text-heading">Pasirink pirties seansą</DialogTitle>
          <DialogDescription>{DATE_LABEL.format(date)}</DialogDescription>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {sessions.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => {
                  pendingSession.current = row.eventId;
                  onOpenChange(false);
                }}
                className="block min-h-11 w-full space-y-1 px-1 py-3 text-left hover:text-rust-ink"
              >
                <span className="block text-micro text-copy">{row.time}</span>
                <span className="block text-sm font-bold">{row.title}</span>
                <span className="block text-xs text-copy">{row.rate} · {row.seats}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
