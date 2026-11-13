"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useWatch, type Control } from "react-hook-form";
import { useAdmin } from "../admin-store";
import type { NewBookingValues } from "./new-booking-schema";
import { searchCustomers, type CustomerField } from "@/lib/admin/customer-search";
import type { Rider } from "@/lib/admin/types";

interface CustomerSuggestionsProps {
  control: Control<NewBookingValues>;
  /** Which field is being typed in: the suggestions match on it. */
  field: CustomerField;
  onPick: (rider: Rider) => void;
  children: ReactNode;
}

/**
 * Wraps a name or phone input of the booking form: while it has focus, existing customers (Klientai) that match what is
 * typed are listed under it; picking one fills name, phone and e-mail, so the booking is linked to them by contact.
 */
export function CustomerSuggestions({ control, field, onPick, children }: CustomerSuggestionsProps) {
  const { riders } = useAdmin();
  const [name, phone] = useWatch({ control, name: ["name", "phone"] });
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => searchCustomers(riders, field, { name, phone }), [riders, field, name, phone]);

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="space-y-1.5"
    >
      {children}
      {focused && matches.length > 0 ? (
        <ul aria-label="Esami klientai" className="divide-y overflow-hidden rounded-lg border border-border bg-card">
          {matches.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                // Keep focus in the input so the list does not vanish before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(r)}
                className="flex min-h-11 w-full flex-col justify-center px-3 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="truncate font-medium">
                  {r.name} {r.surname}
                </span>
                <span className="truncate text-xs text-muted-foreground">{[r.phone, r.email].filter(Boolean).join(" · ") || "Be kontaktų"}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
