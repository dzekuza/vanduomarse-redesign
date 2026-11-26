import { BedIcon } from "@phosphor-icons/react/dist/ssr";
import { BED_NOTICE } from "@/lib/cabin";
import { cn } from "@/lib/utils";

/** The cabin bed rule, shown wherever a visitor picks a cabin: double beds only, never two single ones. */
export function BedNotice({ className }: { className?: string }) {
  return (
    <aside aria-label="Svarbu apie lovas" className={cn("flex gap-3 border border-ink bg-foam/50 p-3 text-xs leading-relaxed text-ink", className)}>
      <BedIcon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p>
        <strong className="font-bold">{BED_NOTICE.lead}</strong> {BED_NOTICE.detail}
      </p>
    </aside>
  );
}
