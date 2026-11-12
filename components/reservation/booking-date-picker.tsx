import { CalendarBlankIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { DatePicker } from "./date-picker";

type BookingDatePickerProps = Pick<ComponentProps<typeof DatePicker>, "days" | "selected" | "dayDetails" | "onSelect"> & {
  disabled: boolean;
};

/** Always-visible date strip and calendar used after a booking option is chosen. */
export function BookingDatePicker({ disabled, ...props }: BookingDatePickerProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
      <legend className="sr-only">Data</legend>
      <DatePicker
        compact
        wideStrip
        label={<span aria-hidden className="flex items-center gap-2 text-sm font-bold"><CalendarBlankIcon size={18} /> Data</span>}
        {...props}
      />
    </fieldset>
  );
}
