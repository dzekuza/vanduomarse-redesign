"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { todayKey } from "@/lib/sauna"

/** Monday-first Lithuanian weekday heads. */
const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"]

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

interface CalendarGridProps {
  /** yyyy-mm-dd, or "" for none. */
  value: string
  onSelect: (key: string) => void
  /** Earliest / latest selectable day (yyyy-mm-dd). */
  min?: string
  max?: string
}

/**
 * Month grid: Monday first, 44 px day cells, today underlined, the chosen day
 * filled. Arrow keys move by day/week, Home/End to the week's ends, PageUp/Down
 * by month. Days outside min/max are disabled.
 */
export function CalendarGrid({ value, onSelect, min, max }: CalendarGridProps) {
  const today = todayKey()
  const start = value || (min && min > today ? min : today)
  const [view, setView] = useState(`${start.slice(0, 7)}-01`)
  const [focus, setFocus] = useState(start)
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

  return (
    <div className="w-77">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Ankstesnis mėnuo" disabled={prevOff} onClick={() => setView(addMonths(view, -1))} className="grid size-11 place-items-center transition-[scale,opacity] duration-150 enabled:hover:bg-ink/5 disabled:opacity-30 motion-safe:enabled:active:scale-95">
          <ArrowLeftIcon aria-hidden size={18} />
        </button>
        <p aria-live="polite" className="text-sm font-bold">
          {title}
        </p>
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
        {days.map((k, i) =>
          k === null ? (
            <span key={`b${i}`} />
          ) : (
            <button
              key={k}
              type="button"
              role="gridcell"
              data-date={k}
              disabled={off(k)}
              aria-selected={k === value}
              aria-current={k === today ? "date" : undefined}
              tabIndex={k === roving ? 0 : -1}
              onClick={() => onSelect(k)}
              className={cn(
                "grid size-11 place-items-center text-sm tabular-nums transition-[color,background-color,scale] duration-150 ease-out-strong focus-visible:outline-3 focus-visible:outline-water motion-safe:enabled:active:scale-95",
                k === value ? "bg-ink font-bold text-dust" : "enabled:hover:bg-ink/10",
                k === today && k !== value && "font-bold underline decoration-rust decoration-2 underline-offset-4",
                off(k) && "text-ink/30"
              )}
            >
              {Number(k.slice(8))}
            </button>
          )
        )}
      </div>
    </div>
  )
}
