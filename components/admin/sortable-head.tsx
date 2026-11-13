"use client";

import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

/** Click: ascending, again: descending, a third time: back to the default order (`null`). */
export function nextSort<K extends string>(current: SortState<K> | null, key: K): SortState<K> | null {
  if (current?.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
}

interface SortableHeadProps<K extends string> {
  sortKey: K;
  sort: SortState<K> | null;
  onSort: (next: SortState<K> | null) => void;
  className?: string;
  children: React.ReactNode;
}

/** A table header cell that sorts its column when pressed; shows the current direction. */
export function SortableHead<K extends string>({ sortKey, sort, onSort, className, children }: SortableHeadProps<K>) {
  const active = sort?.key === sortKey ? sort.direction : null;
  const Icon = active === "asc" ? CaretUpIcon : active === "desc" ? CaretDownIcon : CaretUpDownIcon;
  const right = className?.includes("text-right");
  return (
    <TableHead className={className} aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}>
      <button type="button" onClick={() => onSort(nextSort(sort, sortKey))} className={cn("inline-flex min-h-11 items-center gap-1 font-bold", right && "flex-row-reverse", !active && "text-muted-foreground")}>
        {children}
        <Icon size={14} aria-hidden />
      </button>
    </TableHead>
  );
}
