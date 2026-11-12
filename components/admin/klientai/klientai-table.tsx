"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanBadge } from "../apyrankes/plan-badge";
import { RiderAvatar } from "../apyrankes/rider-avatar";
import { formatDateTime } from "@/lib/admin/format";
import type { Rider, RiderCard } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface KlientaiTableProps {
  riders: readonly Rider[];
  riderCards: readonly RiderCard[];
  /** Customers who have a site account. */
  accountIds: ReadonlySet<string>;
  /** ISO time of each customer's latest order, by rider id. */
  lastActivity: ReadonlyMap<string, string>;
  onRebind: (rider: Rider) => void;
  /** Ticked customers (by id) for bulk actions. */
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Ticks or unticks every row shown. */
  onToggleAll: (checked: boolean) => void;
}

/** The customer list as a table: contact, plan, bracelet and last activity on wide screens, a stacked name cell on phones. */
export function KlientaiTable({ riders, riderCards, accountIds, lastActivity, onRebind, selected, onToggle, onToggleAll }: KlientaiTableProps) {
  const router = useRouter();
  const cardByRider = new Map(riderCards.map((c) => [c.riderId, c]));
  const shownSelected = riders.filter((r) => selected.has(r.id)).length;
  const allState = shownSelected === 0 ? false : shownSelected === riders.length ? true : "indeterminate";

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-4">
              <Checkbox aria-label="Pažymėti visus rodomus klientus" checked={allState} onCheckedChange={(v) => onToggleAll(v === true)} />
            </TableHead>
            <TableHead>Klientas</TableHead>
            <TableHead className="hidden md:table-cell">Kontaktai</TableHead>
            <TableHead className="hidden sm:table-cell">Planas</TableHead>
            <TableHead className="hidden lg:table-cell">Apyrankė</TableHead>
            <TableHead className="hidden xl:table-cell">Paskutinė veikla</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Veiksmai</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((r) => {
            const card = cardByRider.get(r.id);
            const last = lastActivity.get(r.id);
            const contact = r.phone || r.email || "Nėra kontaktų";
            return (
              <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined} className="cursor-pointer" onClick={() => router.push(`/admin/klientai/${r.id}`)}>
                <TableCell className="w-12 pl-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox aria-label={`Pažymėti ${r.name} ${r.surname}`} checked={selected.has(r.id)} onCheckedChange={() => onToggle(r.id)} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/klientai/${r.id}`} onClick={(e) => e.stopPropagation()} className="flex min-h-11 min-w-0 items-center gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring">
                    <RiderAvatar name={r.name} surname={r.surname} avatarPath={r.avatarPath} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {r.name} {r.surname}
                      </span>
                      {r.selfRegistered || accountIds.has(r.id) ? (
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          {r.selfRegistered ? <Badge variant="outline">Internetu</Badge> : null}
                          {accountIds.has(r.id) ? <Badge variant="secondary">Turi paskyrą</Badge> : null}
                        </span>
                      ) : null}
                      <span className="block truncate text-xs text-muted-foreground md:hidden">{contact}</span>
                      <PlanBadge planId={r.planId} className="mt-1 sm:hidden" />
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-56 truncate md:table-cell">
                  <span className="block truncate">{contact}</span>
                  {r.phone && r.email ? <span className="block truncate text-xs text-muted-foreground">{r.email}</span> : null}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <PlanBadge planId={r.planId} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {card ? <span className="font-mono text-xs">{card.cardNumber}</span> : <span className="text-xs text-muted-foreground">Nėra apyrankės</span>}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{last ? formatDateTime(last) : "—"}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRebind(r);
                    }}
                  >
                    {card ? "Pakeisti apyrankę" : "Priskirti apyrankę"}
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
