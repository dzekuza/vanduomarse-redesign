"use client";

import { ArrowRightIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { PlanBadge } from "../apyrankes/plan-badge";
import { RiderAvatar } from "../apyrankes/rider-avatar";
import { ScanTarget } from "../apyrankes/scan-target";
import { AdminPage } from "../admin-page";
import { ActiveSessionRow } from "./active-session-row";
import { useElapsed } from "@/hooks/use-elapsed";
import type { Rider, RiderSession } from "@/lib/admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScanResult = { rider: Rider; session: RiderSession; action: "checked_in" | "checked_out" } | { unknownCard: string };

function ScanResultCard({ result, onDone }: { result: ScanResult; onDone: () => void }) {
  // Always called (rules of hooks) with placeholder timestamps for the "unknown bracelet" branch, which never renders it.
  const session = "session" in result ? result.session : null;
  const elapsed = useElapsed(session?.startedAt ?? new Date().toISOString(), session?.endedAt ?? null);

  if ("unknownCard" in result) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <WarningCircleIcon size={36} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-bold">Nežinoma apyrankė</p>
        <p className="text-sm text-muted-foreground">Apyrankė nepriskirta jokiam naudotojui. Priskirkite ją Apyrankių skiltyje „Pardavimas“.</p>
        <p className="font-mono text-xs text-muted-foreground">apyrankė {result.unknownCard}</p>
        <RetryButton onClick={onDone} />
      </div>
    );
  }

  const { rider, action } = result;
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} className="size-20 text-lg" />
      <div>
        <p className="text-lg font-bold">
          {rider.name} {rider.surname}
        </p>
        {rider.phone ? <p className="text-sm text-muted-foreground">{rider.phone}</p> : null}
      </div>
      <PlanBadge planId={rider.planId} />
      <span
        className={
          action === "checked_in"
            ? "rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
            : "rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground"
        }
      >
        {action === "checked_in" ? "Atvyko į vandenį" : `Išvyko · ${elapsed}`}
      </span>
      <RetryButton onClick={onDone} />
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-bold hover:bg-muted"
    >
      <XIcon size={16} /> Skenuoti kitą
    </button>
  );
}

/**
 * Instructor's own screen: scan a rider's bracelet to check them in or out of
 * the water (the same bracelet toggles both), and see who's currently out and
 * for how long. A narrow slice of /admin/apyrankes for staff who only need this.
 */
export function InstruktoriusView() {
  const { riders, riderSessions, scanRiderSession } = useAdmin();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const active = useMemo(
    () =>
      riderSessions
        .filter((s) => s.endedAt === null)
        .map((session) => ({ session, rider: riders.find((r) => r.id === session.riderId) }))
        .filter((row): row is { session: RiderSession; rider: Rider } => row.rider !== undefined)
        .sort((a, b) => a.session.startedAt.localeCompare(b.session.startedAt)),
    [riderSessions, riders],
  );

  async function handleScan(cardNumber: string) {
    setScanning(true);
    const res = await scanRiderSession(cardNumber);
    setScanning(false);
    if ("data" in res) {
      setResult({ rider: res.data.rider, session: res.data.session, action: res.data.action });
    } else if (res.error.code === "not_found") {
      setResult({ unknownCard: cardNumber });
    }
  }

  return (
    <AdminPage title="Instruktorius" description="Apyrankės skenavimas vandenyje: atvykimas, išvykimas ir dabartinės sesijos trukmė.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
        <Card>
          <CardContent className="pt-6">
            {result ? (
              <ScanResultCard result={result} onDone={() => setResult(null)} />
            ) : (
              <ScanTarget enabled={!scanning} title="Pasiruošta skenuoti" subtitle="Priglauskite apyrankę — atvykimui arba išvykimui" onScan={handleScan} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <ArrowRightIcon size={16} className="text-muted-foreground" /> Šiuo metu vandenyje ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-sm text-muted-foreground">Dabar niekas nepažymėtas kaip vandenyje.</p>
            ) : (
              active.map(({ rider, session }) => <ActiveSessionRow key={session.id} rider={rider} session={session} />)
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
