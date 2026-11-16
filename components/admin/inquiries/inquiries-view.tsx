"use client";

import { ChatsCircleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { InquiriesTable } from "./inquiries-table";
import { InquirySheet } from "./inquiry-sheet";
import { useDeleteInquiry } from "./use-delete-inquiry";
import { INQUIRY_STATUS } from "@/lib/admin/labels";
import type { InquiryStatus } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES = Object.keys(INQUIRY_STATUS) as InquiryStatus[];

/** `/admin/uzklausos`: every inquiry as a list, newest first, with status filters and search; a row opens the inquiry's panel (status, notes, accept). */
export function InquiriesView() {
  const { inquiries } = useAdmin();
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<InquiryStatus | null>(null);
  const [query, setQuery] = useState("");
  const { remove, dialog } = useDeleteInquiry((id) => setOpenId((open) => (open === id ? null : open)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries
      .filter(
        (i) =>
          (!status || i.status === status) &&
          (q === "" || [i.customer.name, i.customer.email, i.customer.phone, i.eventType, i.space].some((v) => v.toLowerCase().includes(q))),
      )
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [inquiries, status, query]);

  return (
    <AdminPage title="Užklausos" description="Renginių užklausos iš skaičiuoklės, registracijų ir kontaktų formos. Atidarykite užklausą, kad pakeistumėte būseną ar pridėtumėte pastabą.">
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "užklausa" : "užklausos"}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button key={s} type="button" size="sm" variant={status === s ? "default" : "outline"} className="min-h-9" onClick={() => setStatus(status === s ? null : s)}>
              {INQUIRY_STATUS[s]} <span className="font-normal opacity-70">{inquiries.filter((i) => i.status === s).length}</span>
            </Button>
          ))}
        </div>
        <Input aria-label="Paieška" placeholder="Paieška" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 w-full sm:w-56" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <ChatsCircleIcon size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold">Užklausų nėra</p>
        </div>
      ) : (
        <InquiriesTable inquiries={filtered} onOpen={setOpenId} onRemove={remove} />
      )}

      <InquirySheet inquiry={inquiries.find((q) => q.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} onRemove={remove} />
      {dialog}
    </AdminPage>
  );
}
