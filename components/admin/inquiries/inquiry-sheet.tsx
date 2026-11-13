"use client";

import { EnvelopeSimpleIcon, PhoneIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { NoteForm } from "./note-form";
import type { DeleteInquiryTarget } from "./use-delete-inquiry";
import { INQUIRY_SOURCE, INQUIRY_STATUS } from "@/lib/admin/labels";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import type { Inquiry, InquiryStatus } from "@/lib/admin/types";
import { findStayType } from "@/lib/cabin";
import { formatHour } from "@/lib/sauna";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface InquirySheetProps {
  inquiry: Inquiry | null;
  onOpenChange: (open: boolean) => void;
  onRemove: (target: DeleteInquiryTarget) => void;
}

/** Inquiry details: request, estimate, contact, status pipeline and notes. */
export function InquirySheet({ inquiry, onOpenChange, onRemove }: InquirySheetProps) {
  const { setInquiryStatus, addInquiryNote, acceptInquiry, releaseInquiry, stayTypes, saunas, programs, upsells } = useAdmin();
  const holdable = !!inquiry && (inquiry.stays.length > 0 || inquiry.saunas.length > 0);
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

              {holdable ? (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Užimami nameliai ir pirtys</p>
                  <ul className="space-y-1 text-sm">
                    {inquiry.stays.map((s) => (
                      <li key={s.typeId}>
                        {s.units} × {findStayType(stayTypes, s.typeId)?.label ?? s.typeId}, {inquiry.stayNights} {inquiry.stayNights === 1 ? "naktis" : "naktys"}
                      </li>
                    ))}
                    {inquiry.saunas.map((s) => (
                      <li key={s.saunaId}>
                        {saunas.find((x) => x.id === s.saunaId)?.name ?? s.saunaId}, {s.programId ? (programs.find((p) => p.id === s.programId)?.name ?? s.programId) : `${s.hours} val.`}
                        {s.startHour === null ? <span className="text-muted-foreground"> (be laiko – neužimama)</span> : <>, nuo {formatHour(s.startHour)}</>}
                        {Object.keys(s.extras).length > 0 ? <span className="text-muted-foreground"> · {Object.entries(s.extras).map(([id, qty]) => `${upsells.find((u) => u.id === id)?.name ?? id}${qty > 1 ? ` × ${qty}` : ""}`).join(", ")}</span> : null}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">Data: {inquiry.date ? formatDay(inquiry.date) : "nenurodyta"}.</p>
                  {inquiry.acceptedAt ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge>Užimta</Badge>
                      <Button variant="outline" className="min-h-11" onClick={() => releaseInquiry(inquiry.id).then((r) => "data" in r && toast.success("Atlaisvinta"))}>
                        Atlaisvinti
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="min-h-11"
                      disabled={!inquiry.date}
                      onClick={() => acceptInquiry(inquiry.id).then((r) => "data" in r && toast.success("Užklausa priimta, nameliai ir pirtys užimti"))}
                    >
                      Priimti ir užimti
                    </Button>
                  )}
                </div>
              ) : null}

              <div className="space-y-1 border-t pt-4 text-sm">
                <p className="font-medium">{inquiry.customer.name}</p>
                <a href={`mailto:${inquiry.customer.email}?subject=${encodeURIComponent(`Dėl užklausos: ${inquiry.eventType}`)}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <EnvelopeSimpleIcon size={18} /> {inquiry.customer.email}
                </a>
                <a href={`tel:${inquiry.customer.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 hover:text-rust">
                  <PhoneIcon size={18} /> {inquiry.customer.phone}
                </a>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Pastabos</p>
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

              <div className="border-t pt-4">
                <Button variant="outline" className="min-h-11 text-destructive hover:text-destructive" disabled={!!inquiry.acceptedAt} onClick={() => onRemove({ id: inquiry.id, title: inquiry.eventType })}>
                  <TrashIcon size={18} /> Pašalinti užklausą
                </Button>
                {inquiry.acceptedAt ? <p className="mt-2 text-xs text-muted-foreground">Užklausa užima namelius ar pirtis. Pirmiausia ją atlaisvinkite.</p> : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
