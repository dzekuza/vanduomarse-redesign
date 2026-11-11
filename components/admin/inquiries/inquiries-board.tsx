"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { InquiryCard } from "./inquiry-card";
import { INQUIRY_STATUS } from "@/lib/admin/labels";
import type { Inquiry, InquiryStatus } from "@/lib/admin/types";

const STATUSES = Object.keys(INQUIRY_STATUS) as InquiryStatus[];

/** One column per status; drag a card into another column to change its status (the panel's select does the same without a mouse). */
export function InquiriesBoard({ inquiries, onOpen }: { inquiries: Inquiry[]; onOpen: (id: string) => void }) {
  const { setInquiryStatus } = useAdmin();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<InquiryStatus | null>(null);

  function drop(status: InquiryStatus) {
    const moved = inquiries.find((q) => q.id === dragId);
    setDragId(null);
    setOverStatus(null);
    if (!moved || moved.status === status) return;
    setInquiryStatus(moved.id, status);
    toast.success(`Būsena: ${INQUIRY_STATUS[status]}`);
  }

  return (
    <div className="grid items-start gap-4 md:grid-cols-3">
      {STATUSES.map((status) => {
        const cards = inquiries.filter((q) => q.status === status).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
        const over = overStatus === status && dragId !== null;
        return (
          <section
            key={status}
            aria-label={`${INQUIRY_STATUS[status]}: ${cards.length}`}
            onDragOver={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverStatus(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverStatus((s) => (s === status ? null : s));
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(status);
            }}
            className={`min-h-48 space-y-3 border p-3 transition-colors duration-150 ${over ? "border-ink bg-muted" : "border-border bg-muted/40"}`}
          >
            <h2 className="flex items-center justify-between text-sm font-bold">
              {INQUIRY_STATUS[status]}
              <span className="font-normal text-muted-foreground">{cards.length}</span>
            </h2>
            {cards.map((q) => (
              <InquiryCard key={q.id} inquiry={q} dragging={dragId === q.id} onOpen={() => onOpen(q.id)} onDragStart={() => setDragId(q.id)} onDragEnd={() => { setDragId(null); setOverStatus(null); }} />
            ))}
            {cards.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">{dragId ? "Nuleisk čia" : "Užklausų nėra"}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
