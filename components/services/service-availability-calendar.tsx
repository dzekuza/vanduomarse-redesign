import { useMemo, useRef, useState, type ReactNode } from "react";
import { DatePicker } from "@/components/reservation/date-picker";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";
import { cn } from "@/lib/utils";
import { AvailabilityCount } from "./availability-count";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });

interface ServiceAvailabilityCalendarProps {
  today: string;
  day?: string;
  onDayChange?: (day: string) => void;
  description: string;
  title: string;
  cardLabel: string;
  countLabel: string;
  emptyLabel?: string;
  datePrefix?: string;
  getCount: (date: Date) => { free: number; capacity: number } | null;
  renderDetails: (date: Date) => ReactNode;
}

export function ServiceAvailabilityCalendar({
  today, day, onDayChange, description, title, cardLabel, countLabel,
  emptyLabel = "Vietų nėra", datePrefix, getCount, renderDetails,
}: ServiceAvailabilityCalendarProps) {
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const [openedDate, setOpenedDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const calendar = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const selected = day ? days.find((date) => dateKey(date) === day) ?? days[0] : openedDate ?? days[0];

  function showDay(date: Date, trigger?: HTMLButtonElement) {
    const key = dateKey(date);
    onDayChange?.(key);
    if (!getCount(date)) return;
    opener.current = trigger ?? calendar.current?.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`) ?? null;
    setOpenedDate(date);
    setOpen(true);
  }

  return (
    <div ref={calendar} className="@container/service-schedule min-w-0 space-y-5">
      <p className="text-sm text-copy">{description}</p>
      <DatePicker
        days={days}
        selected={selected}
        onSelect={showDay}
        initialView="calendar"
        dayDetails={(date, view) => {
          const availability = getCount(date);
          if (!availability) return { label: emptyLabel, available: false };
          const { free, capacity } = availability;
          const label = `${countLabel}: ${free} iš ${capacity}`;
          const count = <AvailabilityCount free={free} capacity={capacity} showDot />;
          return {
            label,
            available: free > 0,
            opensDialog: true,
            indicator: <span className={cn("block text-micro leading-tight tracking-normal", view === "calendar" && "@lg/service-schedule:hidden")}>{count}</span>,
            actions: view === "calendar" ? (
              <div className="hidden px-1 pb-1 @lg/service-schedule:block">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`${title}, ${DATE_LABEL.format(date)} · ${label}`}
                  onClick={(event) => showDay(date, event.currentTarget)}
                  className="block min-h-11 w-full space-y-1 border border-line bg-foam p-1.5 text-left text-micro leading-tight tracking-normal text-ink hover:border-ink"
                >
                  <span className="block font-bold wrap-anywhere">{cardLabel}</span>
                  {count}
                </button>
              </div>
            ) : undefined,
          };
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus({ preventScroll: true });
          }}
        >
          <DialogPhotoClose />
          <header className="shrink-0 space-y-2 border-b border-line p-5 pr-16 sm:p-6 sm:pr-18">
            <DialogTitle className="font-display text-heading">{title}</DialogTitle>
            <DialogDescription>{datePrefix}{DATE_LABEL.format(openedDate ?? selected)}</DialogDescription>
          </header>
          <div className="min-h-0 space-y-3 overflow-y-auto p-5 sm:p-6">
            {openedDate && renderDetails(openedDate)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
