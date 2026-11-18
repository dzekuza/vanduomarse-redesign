"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatPoints } from "@/lib/points";

interface UsePointsFieldProps {
  checked: boolean;
  disabled: boolean;
  /** Points that would be used and the euros they take off (a preview; the server works it out again). */
  points: number;
  euros: number;
  /** The customer's whole balance, already formatted. */
  balance: string;
  onChange: (use: boolean) => void;
}

/** "Naudoti taškus" in the checkout: pay part of the price with the customer's points (ADR-0122). */
export function UsePointsField({ checked, disabled, points, euros, balance, onChange }: UsePointsFieldProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-start gap-3 border border-line p-4">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(next) => onChange(next === true)} className="mt-0.5" />
      <Label htmlFor={id} className="block cursor-pointer text-sm font-normal leading-snug">
        <span className="font-bold">Naudoti taškus</span>
        <span className="block text-copy">
          Turite {balance}. Panaudosime {formatPoints(points)} ir nuskaičiuosime {euros.toLocaleString("lt-LT", { minimumFractionDigits: 2 })} € nuo kainos.
        </span>
      </Label>
    </div>
  );
}
