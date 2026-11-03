"use client";

import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { NoteForm } from "./note-form";
import { INQUIRY_SOURCE, INQUIRY_STATUS } from "@/lib/admin/labels";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import type { Inquiry, InquiryStatus } from "@/lib/admin/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface InquirySheetProps {
  inquiry: Inquiry | null;
  onOpenChange: (open: boolean) => void;
}

/** Inquiry details: request, estimate, contact, status pipeline and notes. */
export function InquirySheet({ inquiry, onOpenChange }: InquirySheetProps) {
  const { setInquiryStatus, addInquiryNote } = useAdmin();
  return (
    <Sheet open={!!inquiry} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {inquiry ? (
          <>
            <SheetHeader>
              <SheetTitle>{inquiry.eventType}</SheetTitle>
              <SheetDescription>
                {INQUIRY_SOURCE[inquiry.source]} · {formatDateTime(inquiry.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <div className="space-y-2">
                <Label htmlFor="inq-status">Būsena</Label>
                <Select
                  value={inquiry.status}
                  onValueChange={(v) => {
                    setInquiryStatus(inquiry.id, v as InquiryStatus);
                    toast.success(`Būsena: ${INQUIRY_STATUS[v as InquiryStatus]}`);
                  }}
                >
                  <SelectTrigger id="inq-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(INQUIRY_STATUS) as InquiryStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {INQUIRY_STATUS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Data", formatDay(inquiry.date)],
                  ["Svečiai", `${inquiry.guests} asm.`],
                  ["Erdvė", inquiry.space],
                  ["Sąmata", inquiry.estimate ? formatEurRange(inquiry.estimate) : "-"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-normal">{v}</dd>
                  </div>
                ))}
              </dl>

              <blockquote className="border-l-2 border-rust pl-3 text-sm">{inquiry.message}</blockquote>

              <div className="space-y-1 border-t pt-4 text-sm">
                <p className="font-normal">{inquiry.customer.name}</p>
                <a href={`mailto:${inquiry.customer.email}?subject=${encodeURIComponent(`Dėl užklausos: ${inquiry.eventType}`)}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <EnvelopeSimpleIcon size={18} /> {inquiry.customer.email}
                </a>
                <a href={`tel:${inquiry.customer.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <PhoneIcon size={18} /> {inquiry.customer.phone}
                </a>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-normal">Pastabos</p>
                {inquiry.notes.length === 0 ? <p className="text-sm text-muted-foreground">Pastabų dar nėra.</p> : null}
                <ul className="space-y-2">
                  {inquiry.notes.map((n) => (
                    <li key={n.at + n.text} className="bg-muted p-3 text-sm">
                      <p className="text-xs text-muted-foreground">{formatDateTime(n.at)}</p>
                      <p className="mt-1">{n.text}</p>
                    </li>
                  ))}
                </ul>
                <NoteForm
                  onAdd={(text) => {
                    addInquiryNote(inquiry.id, text);
                    toast.success("Pastaba pridėta");
                  }}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
