"use client"

import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"

interface BirthdateInputProps {
  id?: string
  /** yyyy-mm-dd, or "" while incomplete or invalid. */
  value: string
  onChange: (value: string) => void
  /** Latest allowed date, yyyy-mm-dd. */
  max?: string
  invalid?: boolean
  describedBy?: string
}

const digits = (raw: string, length: number) => raw.replace(/\D/g, "").slice(0, length)

const parts = (value: string) => {
  const [y = "", m = "", d = ""] = value.split("-")
  return { y, m: m.replace(/^0/, ""), d: d.replace(/^0/, "") }
}

/** Returns yyyy-mm-dd for a real calendar date within `max`, otherwise "". */
function toKey(y: string, m: string, d: string, max?: string) {
  if (y.length !== 4 || !m || !d) return ""
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return ""
  const key = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  return max && key > max ? "" : key
}

/** Birth date as three number fields (year, month, day); the value stays a plain yyyy-mm-dd string. */
export function BirthdateInput({ id, value, onChange, max, invalid, describedBy }: BirthdateInputProps) {
  const [fields, setFields] = useState(() => parts(value))
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)

  const update = (next: typeof fields) => {
    setFields(next)
    onChange(toKey(next.y, next.m, next.d, max))
  }

  const shared = { inputMode: "numeric" as const, autoComplete: "off", "aria-invalid": invalid || undefined, "aria-describedby": describedBy, className: "min-h-11 text-center" }

  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
      <Input
        {...shared}
        id={id}
        placeholder="Metai"
        aria-label="Metai"
        autoComplete="bday-year"
        value={fields.y}
        onChange={(e) => {
          const y = digits(e.target.value, 4)
          update({ ...fields, y })
          if (y.length === 4) monthRef.current?.focus()
        }}
      />
      <Input
        {...shared}
        ref={monthRef}
        placeholder="Mėn."
        aria-label="Mėnuo"
        autoComplete="bday-month"
        value={fields.m}
        onChange={(e) => {
          const m = digits(e.target.value, 2)
          update({ ...fields, m })
          if (m.length === 2 || Number(m) > 1) dayRef.current?.focus()
        }}
      />
      <Input
        {...shared}
        ref={dayRef}
        placeholder="Diena"
        aria-label="Diena"
        autoComplete="bday-day"
        value={fields.d}
        onChange={(e) => update({ ...fields, d: digits(e.target.value, 2) })}
      />
    </div>
  )
}
