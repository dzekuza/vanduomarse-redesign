"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { FormField } from "../form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** A form that carries the shared payment fields (`paymentFormShape`). */
type WithPayment = FieldValues & { paid: "sumoketa" | "nesumoketa"; payMethod: "grynais" | "kortele" };

interface BookingPaymentFieldsProps<T extends WithPayment> {
  control: Control<T>;
  /** Not paid at entry: the customer is e-mailed a payment link instead of a method being recorded. */
  unpaid: boolean;
}

const PAID = [
  { value: "sumoketa", label: "Sumokėta" },
  { value: "nesumoketa", label: "Nesumokėta" },
];

const METHOD = [
  { value: "grynais", label: "Grynais" },
  { value: "kortele", label: "Kortele" },
];

/** How a staff-entered reservation was paid: the method and whether it was; unpaid ones get a payment link by e-mail. */
export function BookingPaymentFields<T extends WithPayment>({ control, unpaid }: BookingPaymentFieldsProps<T>) {
  const select = (name: "paid" | "payMethod", id: string, options: { value: string; label: string }[]) => (
    <Controller
      control={control}
      name={name as Path<T>}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <>
      <FormField id="nb-paid" label="Apmokėjimas">
        {select("paid", "nb-paid", PAID)}
      </FormField>
      {unpaid ? (
        <p className="self-end text-xs text-muted-foreground">Klientui bus sukurta apmokėjimo nuoroda ir išsiųsta el. paštu (galioja 24 val.).</p>
      ) : (
        <FormField id="nb-method" label="Mokėjimas">
          {select("payMethod", "nb-method", METHOD)}
        </FormField>
      )}
    </>
  );
}
