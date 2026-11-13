"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { INQUIRY_SOURCE } from "@/lib/admin/labels";
import { formatDateTime, formatDay, formatEurRange } from "@/lib/admin/format";
import type { Inquiry } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InquiryCardProps {
  inquiry: Inquiry;
  dragging: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

/** One inquiry on the board: draggable to another status column; the title opens its panel. */
export function InquiryCard({ inquiry: q, dragging, onOpen, onRemove, onDragStart, onDragEnd }: InquiryCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", q.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`relative cursor-grab transition-[opacity,border-color] duration-150 focus-within:border-ink hover:border-ink active:cursor-grabbing ${dragging ? "opacity-40" : ""}`}
    >
      <CardHeader>
        <CardTitle className="text-item">
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 focus-visible:outline-none">
            {q.eventType}
          </button>
        </CardTitle>
        <CardAction>
          <Button type="button" variant="ghost" size="icon" className="relative z-10 -mt-3 -mr-2 size-11 text-muted-foreground hover:text-destructive" aria-label={`Pašalinti: ${q.eventType}`} onClick={onRemove}>
            <TrashIcon size={18} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          {formatDay(q.date)} · {q.guests} asm.
        </p>
        <p className="text-muted-foreground">{q.space}</p>
        {q.estimate ? <p className="font-display text-figure font-bold">{formatEurRange(q.estimate)}</p> : null}
        {q.acceptedAt ? <p className="text-xs font-medium">Užimta: nameliai ir pirtys</p> : null}
        <p className="truncate text-xs text-muted-foreground">
          {q.customer.name} · {INQUIRY_SOURCE[q.source]} · {formatDateTime(q.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
