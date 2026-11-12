"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAdmin } from "./admin-store";
import { makeCustomerLookup } from "@/lib/admin/customer-match";
import { hasPermission } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

interface CustomerLinkProps {
  name: string;
  /** The order's stored link to a customer, when it has one. */
  riderId?: string;
  /** The order's contact, used to find the customer when there is no stored link. */
  phone?: string | null;
  email?: string | null;
  className?: string;
}

/**
 * A customer's name that opens their page (`/admin/klientai/[id]`). The customer is the order's stored link or, failing
 * that, the one whose phone or e-mail matches. Plain text when there is no match or the staff member lacks the
 * Klientai page. Clicks do not reach a clickable row around it.
 */
export function CustomerLink({ name, riderId, phone, email, className }: CustomerLinkProps) {
  const { riders, me } = useAdmin();
  const lookup = useMemo(() => makeCustomerLookup(riders), [riders]);
  const id = riderId ?? lookup({ phone, email });
  if (!id || !hasPermission(me, "klientai")) return <>{name}</>;
  return (
    <Link
      href={`/admin/klientai/${id}`}
      onClick={(event) => event.stopPropagation()}
      className={cn("inline-flex min-h-11 max-w-full items-center truncate underline decoration-muted-foreground/50 underline-offset-4 hover:text-rust", className)}
    >
      {name}
    </Link>
  );
}
