"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanBadge } from "./plan-badge";
import { RiderAvatar } from "./rider-avatar";
import { formatDay, formatEur } from "@/lib/admin/format";
import type { Purchase, Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface CustomerRow {
  rider: Rider;
  purchases: Purchase[];
  spent: number;
  lastSoldAt: string | null;
  hasSubscription: boolean;
}

interface CustomersTableProps {
  rows: readonly CustomerRow[];
  /** Customers who have a bracelet bound. */
  cardRiderIds: ReadonlySet<string>;
  /** Start assigning or replacing this customer's bracelet. */
  onAssign: (rider: Rider) => void;
}

/** The Apyrankės > Klientai table: who, current plan, purchases, bracelet and total spent; a row opens the profile. */
export function CustomersTable({ rows, cardRiderIds, onAssign }: CustomersTableProps) {
  const router = useRouter();
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Klientas</TableHead>
            <TableHead className="hidden sm:table-cell">Dabartinis planas</TableHead>
            <TableHead className="hidden md:table-cell">Pirkimai</TableHead>
            <TableHead className="hidden lg:table-cell">Apyrankė</TableHead>
            <TableHead className="text-right">Suma</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Veiksmai</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ rider, purchases: bought, spent, lastSoldAt }) => (
            <TableRow key={rider.id} className="cursor-pointer" onClick={() => router.push(`/admin/klientai/${rider.id}`)}>
              <TableCell className="pl-4">
                <Link href={`/admin/klientai/${rider.id}`} onClick={(e) => e.stopPropagation()} className="flex min-h-11 min-w-0 items-center gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {rider.name} {rider.surname}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{rider.phone || rider.email || "Nėra kontaktų"}</span>
                    <PlanBadge planId={rider.planId} className="mt-1 sm:hidden" />
                  </span>
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <PlanBadge planId={rider.planId} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {bought.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <>
                    <span className="block">{bought.length}</span>
                    {lastSoldAt ? <span className="block text-xs text-muted-foreground">paskutinis {formatDay(lastSoldAt.slice(0, 10))}</span> : null}
                  </>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">{cardRiderIds.has(rider.id) ? "Priskirta" : <span className="text-xs text-muted-foreground">Nėra</span>}</TableCell>
              <TableCell className="text-right font-display text-sm font-bold tabular-nums">{formatEur(spent)}</TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(rider);
                  }}
                >
                  {cardRiderIds.has(rider.id) ? "Pakeisti apyrankę" : "Priskirti apyrankę"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
