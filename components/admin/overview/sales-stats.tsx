import { CoinsIcon, ReceiptIcon, TrendUpIcon } from "@phosphor-icons/react";
import { StatCard } from "./stat-card";
import { formatEur } from "@/lib/admin/format";
import { changePercent, type SalesStats as Stats } from "@/lib/admin/sales-stats";

const compare = (now: number, before: number | undefined): string => {
  if (before === undefined) return "Visas pasirinktas laikotarpis";
  const pct = changePercent(now, before);
  return pct === null ? "Ankstesniame laikotarpyje pardavimų nebuvo" : `${pct > 0 ? "+" : ""}${pct}% prieš ankstesnį laikotarpį`;
};

/** KPI cards: revenue, number of sales and average sale, with change against the previous period when a range is set. */
export function SalesStats({ stats }: { stats: Stats }) {
  const { current, previous } = stats;
  return (
    <div className="space-y-4">
      {stats.couponsSold > 0 ? (
        <p className="text-sm text-muted-foreground">
          Parduota kuponų už {formatEur(stats.couponsSold)}: į pajamas neįtraukta, nes panaudoti jie jau skaičiuojami per rezervacijas.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Pajamos" value={formatEur(current.revenue)} hint={compare(current.revenue, previous?.revenue)} icon={CoinsIcon} />
        <StatCard label="Pardavimų skaičius" value={String(current.count)} hint={compare(current.count, previous?.count)} icon={ReceiptIcon} />
        <StatCard label="Vidutinė suma" value={formatEur(current.average)} hint={compare(current.average, previous?.average)} icon={TrendUpIcon} />
      </div>
    </div>
  );
}
