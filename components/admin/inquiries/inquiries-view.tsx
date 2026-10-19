"use client";

import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { InquiryStatusBadge } from "../status-badge";
import { InquirySheet } from "./inquiry-sheet";
import { INQUIRY_SOURCE, INQUIRY_STATUS } from "@/lib/admin/labels";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import type { InquiryStatus } from "@/lib/admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Filter = InquiryStatus | "visos";

/** Inquiry pipeline: filter by status, open a card to work on it. */
export function InquiriesView() {
  const { inquiries } = useAdmin();
  const [filter, setFilter] = useState<Filter>("visos");
  const [openId, setOpenId] = useState<string | null>(null);

  const statuses = Object.keys(INQUIRY_STATUS) as InquiryStatus[];
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "visos", label: "Visos", count: inquiries.length },
    ...statuses.map((s) => ({ id: s, label: INQUIRY_STATUS[s], count: inquiries.filter((q) => q.status === s).length })),
  ];
  const rows = (filter === "visos" ? inquiries : inquiries.filter((q) => q.status === filter)).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AdminPage title="Užklausos" description="Renginių užklausos iš skaičiuoklės, registracijų ir kontaktų formos.">
      <div role="group" aria-label="Būsenos filtras" className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors ${filter === c.id ? "border-ink bg-ink text-foam" : "bg-card hover:bg-muted"}`}
          >
            {c.label}
            <span className={filter === c.id ? "text-foam/60" : "text-muted-foreground"}>{c.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((q) => (
          <Card key={q.id} className="relative h-full transition-colors focus-within:border-ink hover:border-ink">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">
                <button type="button" onClick={() => setOpenId(q.id)} className="text-left after:absolute after:inset-0 focus-visible:outline-none">
                  {q.eventType}
                </button>
              </CardTitle>
              <InquiryStatusBadge status={q.status} />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {formatDay(q.date)} · {q.guests} asm.
              </p>
              <p className="text-muted-foreground">{q.space}</p>
              {q.estimate ? <p className="font-display text-lg font-bold">{formatEurRange(q.estimate)}</p> : null}
              <p className="truncate text-xs text-muted-foreground">
                {q.customer.name} · {INQUIRY_SOURCE[q.source]} · {formatDateTime(q.createdAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Užklausų su šia būsena nėra.</p> : null}

      <InquirySheet inquiry={inquiries.find((q) => q.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </AdminPage>
  );
}
