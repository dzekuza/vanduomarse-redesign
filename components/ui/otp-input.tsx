"use client"

import { useState, type KeyboardEvent } from "react"
import { cn } from "cn"

interface OtpInputProps {
  id?: string
  /** Digits typed so far. */
  value: string
  onChange: (value: string) => void
  /** How many blocks are drawn (and the most digits accepted). */
  length: number
  invalid?: boolean
  describedBy?: string
  autoFocus?: boolean
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

/**
 * One-time-code field drawn as one block per digit. A single transparent input sits on top of the blocks, so typing,
 * pasting and SMS / email autofill (`autocomplete="one-time-code"`) work like a normal field, and screen readers
 * get one labelled input instead of many.
 */
export function OtpInput({ id, value, onChange, length, invalid, describedBy, autoFocus, onKeyDown, className }: OtpInputProps) {
  const [focused, setFocused] = useState(false)
  const active = Math.min(value.length, length - 1)

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="flex gap-1.5 sm:gap-2">
        {Array.from({ length }, (_, index) => (
          <div
            key={index}
            data-active={focused && index === active ? "" : undefined}
            data-invalid={invalid || undefined}
            className="flex h-14 min-w-0 flex-1 items-center justify-center border border-input text-figure font-bold transition-[border-color,box-shadow] duration-150 data-active:border-ring data-active:ring-3 data-active:ring-ring data-invalid:border-destructive"
          >
            {value[index] ?? ""}
          </div>
        ))}
      </div>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, length))}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          setFocused(true)
          const end = event.currentTarget.value.length
          event.currentTarget.setSelectionRange(end, end)
        }}
        onBlur={() => setFocused(false)}
        // Keep the caret at the end so a digit typed or pasted always continues the code.
        onSelect={(event) => {
          const end = event.currentTarget.value.length
          event.currentTarget.setSelectionRange(end, end)
        }}
        className="absolute inset-0 size-full cursor-text opacity-0"
      />
    </div>
  )
}
