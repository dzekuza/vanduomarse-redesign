import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Hairline-bordered surface of the booking-style pages (`.theme-reservation`): side panels and list cards. */
export function Panel({ as: Tag = "div", className, ...props }: { as?: "div" | "aside" | "article" } & ComponentProps<"div">) {
  return <Tag className={cn("border border-line bg-card p-5", className)} {...props} />;
}
