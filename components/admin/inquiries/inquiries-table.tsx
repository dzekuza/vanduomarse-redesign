"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { InquiryStatusBadge } from "../status-badge";
import { INQUIRY_SOURCE } from "@/lib/admin/labels";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import type { Inquiry } from "@/lib/admin/types";
import type { DeleteInquiryTarget } from "./use-delete-inquiry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InquiriesTableProps {
  inquiries: readonly Inquiry[];
  onOpen: (id: string) => void;
  onRemove: (target: DeleteInquiryTarget) => void;
}

/** Event day and party size; registrations and contact messages may come without a date. */
const eventWhen = (q: Inquiry) => [q.date ? formatDay(q.date) : "Data nenurodyta", q.guests ? `${q.guests} asm.` : ""].filter(Boolean).join(" · ");

/** What an accepted inquiry holds: its cabins, and the saunas that had a start time (the rest were quote lines only). */
const heldLabel = (q: Inquiry) => {
  const held = [q.stays.length ? "nameliai" : "", q.saunas.some((s) => s.startHour !== null) ? "pirtys" : ""].filter(Boolean).join(" ir ");
  return held ? `Užimta: ${held}` : "Užimta";
};

/** The inquiry list as a table, like Klientai: customer, event, quote, source, received and status on wide screens, a stacked cell on phones. A row opens the inquiry's panel. */
export function InquiriesTable({ inquiries, onOpen, onRemove }: InquiriesTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Klientas</TableHead>
            <TableHead className="hidden md:table-cell">Renginys</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Sąmata</TableHead>
            <TableHead className="hidden xl:table-cell">Šaltinis</TableHead>
            <TableHead className="hidden xl:table-cell">Gauta</TableHead>
            <TableHead className="hidden sm:table-cell">Būsena</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Veiksmai</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((q) => {
            const contact = q.customer.phone || q.customer.email || "Nėra kontaktų";
            return (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => onOpen(q.id)}>
                <TableCell className="max-w-48 pl-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(q.id);
                    }}
                    className="block min-h-11 w-full min-w-0 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <span className="block truncate font-bold">{q.customer.name || "Be vardo"}</span>
                    <span className="block truncate text-xs text-muted-foreground">{contact}</span>
                    <span className="block truncate text-xs text-muted-foreground xl:hidden">Gauta {formatDateTime(q.createdAt)}</span>
                    <span className="block truncate text-xs text-muted-foreground md:hidden">
                      {q.eventType} · {eventWhen(q)}
                    </span>
                    {q.acceptedAt ? <span className="block text-xs font-medium">{heldLabel(q)}</span> : null}
                    <span className="mt-1 block sm:hidden">
                      <InquiryStatusBadge status={q.status} />
                    </span>
                  </button>
                </TableCell>
                <TableCell className="hidden max-w-56 md:table-cell">
                  <span className="block truncate">{q.eventType}</span>
                  <span className="block truncate text-xs text-muted-foreground">{[eventWhen(q), q.space].filter(Boolean).join(" · ")}</span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-right tabular-nums lg:table-cell">{q.estimate ? formatEurRange(q.estimate) : "—"}</TableCell>
                <TableCell className="hidden whitespace-nowrap xl:table-cell">{INQUIRY_SOURCE[q.source]}</TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{formatDateTime(q.createdAt)}</TableCell>
                <TableCell className="hidden whitespace-nowrap sm:table-cell">
                  <InquiryStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 text-muted-foreground hover:text-destructive"
                    disabled={!!q.acceptedAt}
                    aria-label={q.acceptedAt ? `${q.eventType}: pirmiausia atlaisvinkite namelius ir pirtis` : `Pašalinti: ${q.eventType}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove({ id: q.id, title: q.eventType });
                    }}
                  >
                    <TrashIcon size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
