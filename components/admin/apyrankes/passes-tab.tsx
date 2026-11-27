"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { PassSheet } from "./pass-sheet";
import { RedeemPassDialog } from "./redeem-pass-dialog";
import { formatDateTime, formatEur } from "@/lib/admin/format";
import type { PlanPass } from "@/lib/admin/types";
import { formatPassCode, normalizePassCode, PASS_STATUS_LABELS, passOwedAmount, type PassStatus } from "@/lib/plan-pass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FILTERS: { id: PassStatus; label: string }[] = [
  { id: "apmoketa", label: "Laukia priskyrimo" },
  // Paid in parts (ADR-0139): the deposit is in, no code until the balance is paid, so it cannot be attached yet.
  { id: "dalinai_apmoketa", label: "Apmokėta dalis" },
  { id: "priskirtas", label: "Priskirti" },
  { id: "atsauktas", label: "Atšaukti" },
];

/** Kodai: abonementai, nupirkti internetu be registracijos (ADR-0109). Darbuotojas randa kodą ir priskiria jį užsiregistravusiam klientui. */
export function PassesTab() {
  const { planPasses, riders } = useAdmin();
  const [filter, setFilter] = useState<PassStatus>("apmoketa");
  const [query, setQuery] = useState("");
  const [redeeming, setRedeeming] = useState<PlanPass | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<PassStatus, number>();
    for (const p of planPasses) map.set(p.status, (map.get(p.status) ?? 0) + 1);
    return map;
  }, [planPasses]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const code = normalizePassCode(query);
    return planPasses.filter((p) => {
      if (p.status !== filter) return false;
      if (q === "") return true;
      return (
        (code.length >= 3 && (p.code ?? "").includes(code)) ||
        p.buyerName.toLowerCase().includes(q) ||
        p.buyerEmail.includes(q) ||
        p.recipientName.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    });
  }, [planPasses, filter, query]);

  const riderName = (id: string | null) => {
    const r = riders.find((x) => x.id === id);
    return r ? `${r.name} ${r.surname}` : null;
  };

  return (
    <div className="space-y-4">
      {notice ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f.id} type="button" size="sm" variant={filter === f.id ? "default" : "outline"} className="min-h-11" onClick={() => setFilter(f.id)}>
              {f.label}
              {counts.get(f.id) ? ` (${counts.get(f.id)})` : ""}
            </Button>
          ))}
        </div>
        <Input placeholder="Kodas, vardas ar el. paštas" aria-label="Ieškoti abonemento" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 w-full sm:w-64" />
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === "apmoketa" ? "Nepriskirtų abonementų nėra." : filter === "dalinai_apmoketa" ? "Likučio laukiančių abonementų nėra." : "Abonementų nėra."}
        </p>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Kodas</TableHead>
                <TableHead>Abonementas</TableHead>
                <TableHead className="hidden md:table-cell">Pirkėjas</TableHead>
                <TableHead className="hidden lg:table-cell">Apmokėta</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Veiksmai</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <span className="block font-mono font-bold">{p.code ? formatPassCode(p.code) : "-"}</span>
                    <span className="block text-xs text-muted-foreground">{p.reference}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-bold">{p.planName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatEur(p.price)}
                      {p.discountCode ? ` · ${p.discountCode}` : ""}
                    </span>
                    {p.gift ? <Badge variant="secondary" className="mt-1">Dovana{p.recipientName ? `: ${p.recipientName}` : ""}</Badge> : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="block">{p.buyerName}</span>
                    <span className="block text-xs text-muted-foreground">{p.buyerEmail}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{p.paidAt ? formatDateTime(p.paidAt) : "-"}</TableCell>
                  <TableCell className="pr-4 text-right">
                    {p.status === "apmoketa" ? (
                      <Button type="button" size="sm" className="min-h-11" onClick={() => setRedeeming(p)}>
                        Priskirti
                      </Button>
                    ) : p.status === "dalinai_apmoketa" ? (
                      <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setViewing(p.id)}>
                        Likutis {formatEur(passOwedAmount(p))}
                      </Button>
                    ) : p.status === "priskirtas" && p.riderId ? (
                      <Link href={`/admin/klientai/${p.riderId}`} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
                        {riderName(p.riderId) ?? "Klientas"}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">{PASS_STATUS_LABELS[p.status]}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <PassSheet pass={planPasses.find((p) => p.id === viewing) ?? null} onOpenChange={(open) => !open && setViewing(null)} />

      <RedeemPassDialog
        pass={redeeming}
        onClose={(message) => {
          setRedeeming(null);
          if (message) setNotice(message);
        }}
      />
    </div>
  );
}
