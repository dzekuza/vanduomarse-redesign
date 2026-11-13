"use client";

import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { InquiriesBoard } from "./inquiries-board";
import { InquirySheet } from "./inquiry-sheet";
import { useDeleteInquiry } from "./use-delete-inquiry";

/** Inquiry pipeline as a board: drag cards between the status columns, open one to work on it. */
export function InquiriesView() {
  const { inquiries } = useAdmin();
  const [openId, setOpenId] = useState<string | null>(null);
  const { remove, dialog } = useDeleteInquiry((id) => setOpenId((open) => (open === id ? null : open)));

  return (
    <AdminPage title="Užklausos" description="Renginių užklausos iš skaičiuoklės, registracijų ir kontaktų formos. Tempk kortelę į kitą stulpelį, kad pakeistum būseną.">
      <InquiriesBoard inquiries={inquiries} onOpen={setOpenId} onRemove={remove} />
      <InquirySheet inquiry={inquiries.find((q) => q.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} onRemove={remove} />
      {dialog}
    </AdminPage>
  );
}
