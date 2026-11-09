import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: Icon;
}

/** One KPI tile on the overview. */
export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon size={20} className="shrink-0 text-rust" />
      </CardHeader>
      <CardContent>
        <p className="font-display whitespace-nowrap text-figure font-bold sm:text-total">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
