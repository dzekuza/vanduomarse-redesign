"use client";

import { QuoteRequestForm } from "@/components/booking/quote-request-form";
import type { Estimate, EstimateInput } from "@/lib/event-pricing";

interface InquiryFormProps {
  estimate: Estimate;
  input: EstimateInput;
  guests: number;
  eventLabel: string;
  spaceLabel: string;
}

/** "Siųsti užklausą": stores the quote, with the event date chosen above, and the calculator input so staff can reopen it in /admin/uzklausos. */
export function InquiryForm({ estimate, input, guests, eventLabel, spaceLabel }: InquiryFormProps) {
  return (
    <QuoteRequestForm
      kicker="Skaičiuoklė"
      idPrefix="inquiry"
      total={estimate.total}
      messageLines={() => [
        `Renginio laikas · ${input.eventTime === "evening" ? "Vakare (nuo 17:00)" : "Dienos metu"}`,
        input.endDate ? `Renginio pabaiga · ${input.endDate}` : "",
      ]}
      request={() => ({
        date: input.date ?? "",
        eventType: eventLabel,
        guests,
        space: spaceLabel,
        estimateMin: estimate.total.min,
        estimateMax: estimate.total.max,
        calculatorInput: { ...input, lines: estimate.lines },
      })}
    />
  );
}
