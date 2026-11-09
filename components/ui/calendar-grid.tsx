"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "cn"
import { todayKey } from "@/lib/sauna"

/** Monday-first Lithuanian weekday heads. */
const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"]
const DAY_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" })

const pad = (n: number) => String(n).padStart(2, "0")
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (key: string) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (key: string, n: number) => {
  const d = parse(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}
const addMonths = (key: string, n: number) => {
  const d = parse(key)
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  return toKey(d)
}

export interface CalendarDayDetails {
  label: string
  indicator: ReactNode
}

interface CalendarGridProps {
  /** yyyy-mm-dd, or "" for none. */
  value: string
  onSelect: (key: string) => void
  /** Earliest / latest selectable day (yyyy-mm-dd). */
  min?: string
  max?: string
  /** Optional indicator and its spoken description for a selectable day. */
  dayDetails?: (key: string) => CalendarDayDetails | undefined
}

/**
 * Month grid: Monday first, 44 px day cells, today underlined, the chosen day
 * filled. Arrow keys move by day/week, Home/End to the week's ends, PageUp/Down
 * by month. Days outside min/max are disabled.
 */
export function CalendarGrid({ value, onSelect, min, max, dayDetails }: CalendarGridProps) {
  const today = todayKey()
  const start = value || (min && min > today ? min : today)
  const [view, setView] = useState(`${start.slice(0, 7)}-01`)
  const [focus, setFocus] = useState(start)
  const [mode, setMode] = useState<"days" | "years">("days")
  const grid = useRef<HTMLDivElement>(null)
  const moved = useRef(false)

  const first = parse(view)
  const lead = (first.getDay() + 6) % 7
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const days = [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${view.slice(0, 8)}${pad(i + 1)}`)]

  const off = (k: string) => Boolean((min && k < min) || (max && k > max))
  const prevOff = Boolean(min && addDays(view, -1) < min)
  const nextOff = Boolean(max && addMonths(view, 1) > max)
  const title = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" }).format(first)

  // A 12-year page to jump straight to a year, for a birthdate decades back — the month arrows alone made that a lot of clicking.
  const YEARS_PER_PAGE = 12
  const viewYear = first.getFullYear()
  const minYear = min ? parse(min).getFullYear() : undefined
  const maxYear = max ? parse(max).getFullYear() : undefined
  const [yearPageStart, setYearPageStart] = useState(() => viewYear - (viewYear % YEARS_PER_PAGE))
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i)
  const yearOff = (y: number) => Boolean((minYear && y < minYear) || (maxYear && y > maxYear))
  const yearPagePrevOff = Boolean(minYear && yearPageStart - 1 < minYear)
  const yearPageNextOff = Boolean(maxYear && yearPageStart + YEARS_PER_PAGE > maxYear)

  function openYears() {
    setYearPageStart(viewYear - (viewYear % YEARS_PER_PAGE))
    setMode("years")
  }

  function pickYear(y: number) {
    let next = `${y}-${view.slice(5, 7)}-01`
    if (min && next < min) next = `${min.slice(0, 7)}-01`
    if (max && next > max) next = `${max.slice(0, 7)}-01`
    setView(next)
    setMode("days")
  }

  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus()
  }, [focus, view])

  const go = (key: string) => {
    if (off(key)) return
    moved.current = true
    setFocus(key)
    setView(`${key.slice(0, 7)}-01`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, string> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -((parse(focus).getDay() + 6) % 7)),
      End: addDays(focus, 6 - ((parse(focus).getDay() + 6) % 7)),
      PageUp: addMonths(focus, -1),
      PageDown: addMonths(focus, 1),
    }
    if (!(e.key in step)) return
    e.preventDefault()
    go(step[e.key])
  }

  const roving = days.includes(focus) && !off(focus) ? focus : days.find((k): k is string => k !== null && !off(k))

  if (mode === "years") {
    return (
      <div className="w-77">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Ankstesni metai" disabled={yearPagePrevOff} onClick={() => setYearPageStart((y) => y - YEARS_PER_PAGE)} className="grid size-11 place-items-center transition-[scale,opacity] duration-150 enabled:hover:bg-ink/5 disabled:opacity-30 motion-safe:enabled:active:scale-95">
            <ArrowLeftIcon aria-hidden size={18} />
          </button>
          <p aria-live="polite" className="text-sm font-bold">
            {yearPageStart}–{yearPageStart + YEARS_PER_PAGE - 1}
          </p>
          <button type="button" aria-label="Kiti metai" disabled={yearPageNextOff} onClick={() => setYearPageStart((y) => y + YEARS_PER_PAGE)} className="grid size-11 place-items-center transition-[scale,opacity] duration-150 enabled:hover:bg-ink/5 disabled:opacity-30 motion-safe:enabled:active:scale-95">
            <ArrowRightIcon aria-hidden size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              disabled={yearOff(y)}
              onClick={() => pickYear(y)}
              className={cn(
                "grid h-11 place-items-center text-sm font-bold tabular-nums transition-[color,background-color,scale] duration-150 ease-out-strong motion-safe:enabled:active:scale-95",
                y === viewYear ? "bg-ink text-dust" : "enabled:hover:bg-ink/10",
                yearOff(y) && "text-ink/30",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-77">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Ankstesnis mėnuo" disabled={prevOff} onClick={() => setView(addMonths(view, -1))} className="grid size-11 place-items-center transition-[scale,opacity] duration-150 enabled:hover:bg-ink/5 disabled:opacity-30 motion-safe:enabled:active:scale-95">
          <ArrowLeftIcon aria-hidden size={18} />
        </button>
        <button type="button" aria-live="polite" onClick={openYears} className="rounded px-2 py-1 text-sm font-bold transition-colors duration-150 hover:bg-ink/5">
          {title}
        </button>
        <button type="button" aria-label="Kitas mėnuo" disabled={nextOff} onClick={() => setView(addMonths(view, 1))} className="grid size-11 place-items-center transition-[scale,opacity] duration-150 enabled:hover:bg-ink/5 disabled:opacity-30 motion-safe:enabled:active:scale-95">
          <ArrowRightIcon aria-hidden size={18} />
        </button>
      </div>
      <div ref={grid} role="grid" aria-label={title} onKeyDown={onKeyDown} className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <span key={d} role="columnheader" className="grid h-8 place-items-center text-micro uppercase text-ink/60">
            {d}
          </span>
        ))}
        {days.map((k, i) => {
          if (k === null) return <span key={`b${i}`} />
          const disabled = off(k)
          const details = disabled ? undefined : dayDetails?.(k)
          const dayNumber = Number(k.slice(8))
          const todayMark = k === today && k !== value && "font-bold underline decoration-rust decoration-2 underline-offset-4"
          return (
            <button
              key={k}
              type="button"
              role="gridcell"
              data-date={k}
              disabled={disabled}
              aria-selected={k === value}
              aria-current={k === today ? "date" : undefined}
              aria-label={details ? `${DAY_LABEL.format(parse(k))} ${details.label}` : undefined}
              tabIndex={k === roving ? 0 : -1}
              onClick={() => onSelect(k)}
              className={cn(
                "grid size-11 place-items-center text-sm tabular-nums transition-[color,background-color,scale] duration-150 ease-out-strong focus-visible:outline-3 focus-visible:outline-water motion-safe:enabled:active:scale-95",
                k === value ? "bg-ink font-bold text-dust" : "enabled:hover:bg-ink/10",
                details ? "content-center gap-0.5" : todayMark,
                disabled && "text-ink/30"
              )}
            >
              {details ? (
                <>
                  <span className={cn("leading-none", todayMark)}>{dayNumber}</span>
                  <span aria-hidden className="grid place-items-center leading-none">{details.indicator}</span>
                </>
              ) : dayNumber}
            </button>
          )
        })}
      </div>
    </div>
  )
}
