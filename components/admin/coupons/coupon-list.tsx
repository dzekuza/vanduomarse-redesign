"use client";

import { useState } from "react";
import { CouponStatusBadge } from "../status-badge";
import { formatDateTime } from "@/lib/admin/format";
import type { Coupon } from "@/lib/admin/types";
import { COUPON_SERVICE_LABEL, formatCode, formatEuro } from "@/lib/coupons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 50;

interface CouponListProps {
  coupons: readonly Coupon[];
  /** Shown when `coupons` is empty. */
  emptyText: string;
  onOpen: (id: string) => void;
}

/** Coupon orders as a table, newest first; a row (or its product name) opens the details sheet. Pages of 50. */
export function CouponList({ coupons, emptyText, onOpen }: CouponListProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  return (
    <div className="space-y-3">
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Užsakyta</TableHead>
              <TableHead>Kuponas</TableHead>
              <TableHead className="hidden md:table-cell">Paslauga</TableHead>
              <TableHead className="hidden sm:table-cell">Pirkėjas</TableHead>
              <TableHead className="hidden lg:table-cell">Kodas</TableHead>
              <TableHead className="text-right">Vertė</TableHead>
              <TableHead>Būsena</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.slice(0, shown).map((c) => {
              const partlyUsed = c.status === "aktyvus" && c.balance < c.faceValue;
              return (
                <TableRow key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer">
                  <TableCell className="whitespace-nowrap">{formatDateTime(c.createdAt)}</TableCell>
                  <TableCell className="max-w-40 sm:max-w-none">
                    <button
                      type="button"
                      className="block max-w-full min-h-11 truncate text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(c.id);
                      }}
                    >
                      {c.productName}
                    </button>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.reference}
                      <span className="sm:hidden"> · {c.buyer.name}</span>
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{COUPON_SERVICE_LABEL[c.service]}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="truncate">{c.buyer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.buyer.email}</p>
                  </TableCell>
                  <TableCell className="hidden font-mono tracking-wide lg:table-cell">{c.code ? formatCode(c.code) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {partlyUsed ? `${formatEuro(c.balance)} iš ${formatEuro(c.faceValue)}` : formatEuro(c.faceValue)}
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              );
            })}
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Rodoma: {Math.min(shown, coupons.length)} iš {coupons.length}</p>
        {coupons.length > shown ? (
          <Button variant="outline" className="min-h-11" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            Rodyti daugiau
          </Button>
        ) : null}
      </div>
    </div>
  );
}
