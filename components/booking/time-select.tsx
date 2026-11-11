"use client";

import type { ComponentProps, ReactNode } from "react";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TimeSelectContent({ children }: { children: ReactNode }) {
  return (
    <SelectContent position="popper" align="start" className="w-(--radix-select-trigger-width) min-w-0 rounded-none border border-line bg-foam text-ink">
      {children}
    </SelectContent>
  );
}

type TimeSelectOptionProps = Omit<ComponentProps<typeof SelectItem>, "children"> & {
  time: string;
  title?: string;
  status?: ReactNode;
};

export function TimeSelectOption({ time, title, status, className, ...props }: TimeSelectOptionProps) {
  return (
    <SelectItem
      {...props}
      textValue={title ? `${time} · ${title}` : time}
      className={cn("min-h-11 rounded-none whitespace-normal data-disabled:opacity-100 *:last:w-full", className)}
    >
      <span className="grid min-w-0 gap-1 py-1">
        {title ? <span className="font-bold">{title}</span> : null}
        <span className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", title || status ? "text-xs" : undefined)}>
          <span className="tabular-nums">{time}</span>
          {status}
        </span>
      </span>
    </SelectItem>
  );
}
