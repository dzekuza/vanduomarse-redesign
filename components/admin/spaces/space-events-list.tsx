"use client";

import { useAdmin } from "../admin-store";
import { CategoryEventsList } from "../events/category-events-list";
import type { ManagedEvent } from "@/lib/admin/types";
import { EVENT_CATEGORIES } from "@/lib/park-events";

/** Upcoming events held in an event space (ADR-0136): each books its space for its duration. The parent owns the dialog. */
export function SpaceEventsList({ onEdit, onDuplicate }: { onEdit: (event: ManagedEvent) => void; onDuplicate: (event: ManagedEvent) => void }) {
  const { spaces } = useAdmin();
  return (
    <CategoryEventsList
      match={(e) => !!e.spaceId}
      emptyText="Būsimų renginių erdvėse nėra."
      extra={(e) => [spaces.find((s) => s.id === e.spaceId)?.label ?? e.spaceId, EVENT_CATEGORIES.find((c) => c.id === e.category)?.label].filter(Boolean).join(" · ")}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
    />
  );
}
