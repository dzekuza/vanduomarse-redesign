"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useSaleDetails } from "./sale-details";
import { formatDay, formatEur } from "@/lib/admin/format";
import { exportFileName } from "@/lib/admin/export";
import { filterSales, SALE_CATEGORIES, SALE_STATE_LABEL, salesRevenue, salesToCsv, type Sale, type SaleFilters } from "@/lib/admin/sales";
import { downloadText } from "@/lib/download";
import { todayKey } from "@/lib/sauna";
import { SaleStatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 50;
/** A name saved without a surname ends in a dash ("Rysard -"); show just the name. */
const cleanName = (name: string) => name.replace(/\s+[-–]\s*$/, "");

const CATEGORY_LABEL = Object.fromEntries(SALE_CATEGORIES.map((c) => [c.id, c.label]));

/** Every sale across pirtis, nakvynė, keturračiai, renginiai, kuponai and apyrankės, filterable by category and date. */
interface SalesTableProps {
  all: readonly Sale[];
  filters: SaleFilters;
}

export function SalesTable({ all, filters }: SalesTableProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const { openSale, sheets } = useSaleDetails();

  const rows = useMemo(() => filterSales(all, filters), [all, filters]);
  const withCoupons = filters.category === "kuponai";
  const revenue = salesRevenue(rows, withCoupons);


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pardavimai</CardTitle>
          <CardDescription>Visos paslaugos pagal pardavimo datą. Rodoma pagal viršuje pasirinktus filtrus.</CardDescription>
          <CardAction>
            <Button variant="outline" className="min-h-11" disabled={rows.length === 0} onClick={() => downloadText(salesToCsv(rows), exportFileName("pardavimai", todayKey()))}>
              <DownloadSimpleIcon size={18} /> Eksportuoti
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
            <p className="text-sm text-muted-foreground">Rodoma pardavimų: {rows.length}</p>
            <p className="text-sm">
              Suma{withCoupons ? "" : " (be kuponų)"}: <span className="font-display text-figure font-bold tabular-nums">{formatEur(revenue)}</span>
            </p>
          </div>

          <Table>
            <TableHeader className="[&_th]:px-3">
              <TableRow>
                <TableHead className="whitespace-nowrap">Parduota</TableHead>
                <TableHead>Prekė</TableHead>
                <TableHead className="hidden xl:table-cell">Kategorija</TableHead>
                <TableHead className="hidden xl:table-cell">Paslaugos laikas</TableHead>
                <TableHead className="hidden sm:table-cell">Klientas</TableHead>
                <TableHead className="text-right">Suma</TableHead>
                <TableHead className="hidden sm:table-cell">Būsena</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_td]:px-3 [&_td]:py-3">
              {rows.slice(0, shown).map((s) => (
                <TableRow key={s.id} onClick={() => openSale(s.target)} className="cursor-pointer">
                  <TableCell className="whitespace-nowrap">{formatDay(s.soldOn)}</TableCell>
                  <TableCell className="max-w-48 sm:max-w-64 xl:max-w-none">
                    <button
                      type="button"
                      className="block max-w-full truncate text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSale(s.target);
                      }}
                    >
                      {s.item}
                    </button>
                    <p className="truncate text-xs text-muted-foreground sm:hidden">{cleanName(s.customer)}</p>
                    <p className="hidden truncate text-xs text-muted-foreground sm:block">
                      {[s.reference, CATEGORY_LABEL[s.category], s.when].filter(Boolean).join(" · ")}
                    </p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{CATEGORY_LABEL[s.category]}</TableCell>
                  <TableCell className="hidden xl:table-cell">{s.when || "—"}</TableCell>
                  <TableCell className="hidden max-w-48 truncate sm:table-cell">{cleanName(s.customer)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatEur(s.total)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <SaleStatusBadge state={s.state} label={s.state === "galioja" ? s.statusLabel : SALE_STATE_LABEL[s.state]} />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Pardavimų pagal filtrus nėra.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          {rows.length > shown ? (
            <Button variant="outline" className="mt-4 min-h-11 w-full sm:w-auto" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              Rodyti daugiau ({rows.length - shown})
            </Button>
          ) : null}
        </CardContent>
      </Card>

    {sheets}
    </>
  );
}
