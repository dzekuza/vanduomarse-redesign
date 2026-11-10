"use client";

import { useAdmin } from "../admin-store";
import { CategoryEventsList } from "../events/category-events-list";
import type { ManagedEvent } from "@/lib/admin/types";

/** Upcoming public sauna sessions (pirties seansai). The card header creates them; the parent owns the dialog. */
export function SaunaSessionsList({ onEdit }: { onEdit: (event: ManagedEvent) => void }) {
  const { programs } = useAdmin();
  return (
    <CategoryEventsList
      category="pirtis"
      emptyText="Būsimų seansų nėra."
      extra={(e) => programs.find((p) => p.id === e.programId)?.name ?? "Be programos"}
      onEdit={onEdit}
    />
  );
}
