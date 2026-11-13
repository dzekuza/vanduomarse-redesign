"use client";

import { useId, useMemo } from "react";
import { useController, useFormContext, type Control, type FieldValues, type Path } from "react-hook-form";
import { DEFAULT_PHONE_COUNTRY, joinPhone, PHONE_COUNTRIES, splitPhone } from "@/lib/phone-countries";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const FIELD =
  "h-11 min-w-0 rounded-lg border border-input bg-card px-3 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

/**
 * Phone number with a country select (Lithuania first, +370). The value is one string, "+370 61234567", which is what the
 * forms and the server already take; the server still normalises it (`toE164`), so older stored numbers like "867312315"
 * keep working: they show as typed under Lithuania and only change when edited. An empty number stays "".
 */
export function PhoneInput({ id, value, onChange, onBlur, invalid, disabled, placeholder = "612 34567", className }: PhoneInputProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const { country, national, foreign } = useMemo(() => splitPhone(value), [value]);

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        aria-label="Šalies kodas"
        value={country.code}
        disabled={disabled}
        onChange={(e) => {
          const next = PHONE_COUNTRIES.find((c) => c.code === e.target.value) ?? DEFAULT_PHONE_COUNTRY;
          onChange(joinPhone(next, national));
        }}
        className={cn(FIELD, "w-30 shrink-0 pr-3 pl-2")}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={foreign ? "+… tarptautinis numeris" : placeholder}
        value={national}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        onChange={(e) => {
          // A pasted international number switches the country by itself.
          const typed = e.target.value;
          const parsed = typed.trim().startsWith("+") || typed.trim().startsWith("00") ? splitPhone(typed) : null;
          if (parsed && !parsed.foreign) return onChange(joinPhone(parsed.country, parsed.national));
          if (parsed?.foreign) return onChange(typed);
          onChange(joinPhone(country, typed));
        }}
        className={cn(FIELD, "w-full")}
      />
    </div>
  );
}

/** `PhoneInput` wired to a react-hook-form field; takes `control` or reads it from a surrounding FormProvider. */
export function FormPhoneInput<T extends FieldValues>({
  name,
  control,
  ...props
}: { name: Path<T>; control?: Control<T> } & Omit<PhoneInputProps, "value" | "onChange" | "onBlur">) {
  const context = useFormContext<T>();
  const { field } = useController<T>({ name, control: control ?? context?.control });
  return <PhoneInput {...props} value={(field.value as string | undefined) ?? ""} onChange={field.onChange} onBlur={field.onBlur} />;
}
