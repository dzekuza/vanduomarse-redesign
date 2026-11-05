"use client";

import { useState, type ReactNode } from "react";
import { Stepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { Panel } from "@/components/panel";

interface CalculatorOptionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  price: string;
  selected: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/** Optional estimate line, with the controls and selection button kept separate. */
export function CalculatorOptionCard({ eyebrow, title, description, price, selected, onToggle, children }: CalculatorOptionCardProps) {
  return (
    <Panel
      as="article"
      aria-label={title}
      className={`flex min-w-0 flex-col gap-4 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : ""}`}
    >
      <div className="space-y-2">
        {eyebrow ? <p className={`text-micro uppercase ${selected ? "text-dust/80" : "text-copy"}`}>{eyebrow}</p> : null}
        <h3 className="text-item font-bold">{title}</h3>
        {description ? <p className={`text-xs leading-relaxed ${selected ? "text-dust/80" : "text-copy"}`}>{description}</p> : null}
        <p className="text-xs font-bold">{price}</p>
      </div>
      <div className={`mt-auto space-y-4 border-t pt-3 ${selected ? "border-line-on-ink" : "border-line"}`}>
        {children}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${selected ? "Pašalinti" : "Pasirinkti"}: ${title}`}
          onClick={onToggle}
          className={ctaClass({ tone: selected ? "cream" : "dark", small: true, className: "inline-flex items-center" })}
        >
          {selected ? "Pašalinti" : "Pasirinkti"}
          <TextCtaArrow />
        </button>
      </div>
    </Panel>
  );
}

interface CalculatorQuantityCardProps extends Omit<CalculatorOptionCardProps, "selected" | "onToggle"> {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
}

/** Keep a valid quantity ready without adding the option to the estimate. */
export function CalculatorQuantityCard({ label, value, min = 1, max, onChange, children, ...card }: CalculatorQuantityCardProps) {
  const [draft, setDraft] = useState(min);
  const selected = value > 0;
  const quantity = selected ? value : draft;

  return (
    <CalculatorOptionCard {...card} selected={selected} onToggle={() => onChange(selected ? 0 : quantity)}>
      <div className="flex flex-wrap items-start gap-4">
        <Stepper label={label} value={quantity} onChange={selected ? onChange : setDraft} min={min} max={max} editable compact />
        {children}
      </div>
    </CalculatorOptionCard>
  );
}
