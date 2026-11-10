"use client"

import { CalendarBlankIcon } from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { CalendarGrid, type CalendarDayDetails } from "@/components/ui/calendar-grid"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { todayKey } from "@/lib/sauna"

interface DatePickerProps {
  id?: string
  /** yyyy-mm-dd, or "" for none. */
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  invalid?: boolean
  describedBy?: string
  className?: string
  dayDetails?: (key: string) => CalendarDayDetails | undefined
  calendarFooter?: ReactNode
}

const longDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("lt-LT", { year: "numeric", month: "long", day: "numeric" })
}

/** Date field that opens a month calendar; the value stays a plain yyyy-mm-dd string, like `<input type="date">`. */
export function DatePicker({ id, value, onChange, min, max, placeholder = "Pasirink datą", invalid, describedBy, className, dayDetails, calendarFooter }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const today = todayKey()
  const todayOff = Boolean((min && today < min) || (max && today > max))
  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          data-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 border border-input bg-transparent px-3 text-left text-sm outline-none transition-[border-color,box-shadow,scale] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 motion-safe:active:scale-[0.99]",
            className
          )}
        >
          <span className={value ? undefined : "text-muted-foreground"}>{value ? longDate(value) : placeholder}</span>
          <CalendarBlankIcon aria-hidden size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <CalendarGrid value={value} min={min} max={max} onSelect={pick} dayDetails={dayDetails} />
        {calendarFooter ? <div className="mt-2 border-t border-line pt-3">{calendarFooter}</div> : null}
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs font-bold">
          <button type="button" disabled={todayOff} onClick={() => pick(today)} className="min-h-11 px-2 transition-opacity duration-150 enabled:hover:underline disabled:opacity-30">
            Šiandien
          </button>
          <button type="button" disabled={!value} onClick={() => pick("")} className="min-h-11 px-2 transition-opacity duration-150 enabled:hover:underline disabled:opacity-30">
            Išvalyti
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
