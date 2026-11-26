"use client";

import { ArrowDownIcon, ArrowsDownUpIcon, ArrowUpIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useSaleDetails } from "./sale-details";
import { formatDay, formatEur } from "@/lib/admin/format";
import { exportFileName } from "@/lib/admin/export";
import { DEFAULT_SALE_SORT, filterSales, SALE_CATEGORIES, SALE_STATE_LABEL, salesRevenue, salesToCsv, sortSales, type Sale, type SaleFilters, type SaleSort, type SaleSortKey } from "@/lib/admin/sales";
import { downloadText } from "@/lib/download";
import { todayKey } from "@/lib/sauna";
import { SaleOriginBadge } from "./sale-origin-badge";
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

/** A column header that sorts the table: first click ascending, second descending. */
function SortHead({ label, field, sort, onSort, className, align }: { label: string; field: SaleSortKey; sort: SaleSort; onSort: (key: SaleSortKey) => void; className?: string; align?: "right" }) {
  const active = sort.key === field;
  const Icon = !active ? ArrowsDownUpIcon : sort.dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring ${align === "right" ? "ml-auto" : ""} ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon size={14} aria-hidden className={active ? "" : "opacity-50"} />
      </button>
    </TableHead>
  );
}

export function SalesTable({ all, filters }: SalesTableProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const { openSale, sheets } = useSaleDetails();

  const [sort, setSort] = useState<SaleSort>(DEFAULT_SALE_SORT);
  const onSort = (key: SaleSortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "soldAt" || key === "total" ? "desc" : "asc" }));
    setShown(PAGE_SIZE);
  };

  const rows = useMemo(() => sortSales(filterSales(all, filters), sort), [all, filters, sort]);
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
                <SortHead label="Parduota" field="soldAt" sort={sort} onSort={onSort} />
                <SortHead label="Prekė" field="item" sort={sort} onSort={onSort} />
                <SortHead label="Kategorija" field="category" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
                <SortHead label="Paslaugos laikas" field="when" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
                <SortHead label="Klientas" field="customer" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortHead label="Suma" field="total" sort={sort} onSort={onSort} className="text-right" align="right" />
                <SortHead label="Būsena" field="state" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortHead label="Šaltinis" field="source" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
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
                    <div className="mt-1 xl:hidden">
                      <SaleOriginBadge source={s.source} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{CATEGORY_LABEL[s.category]}</TableCell>
                  <TableCell className="hidden xl:table-cell">{s.when || "—"}</TableCell>
                  <TableCell className="hidden max-w-48 truncate sm:table-cell">{cleanName(s.customer)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatEur(s.total)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <SaleStatusBadge state={s.state} label={s.state === "galioja" ? s.statusLabel : SALE_STATE_LABEL[s.state]} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap xl:table-cell">
                    <SaleOriginBadge source={s.source} />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
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
