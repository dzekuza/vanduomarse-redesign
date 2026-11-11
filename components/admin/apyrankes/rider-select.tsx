"use client";

import { CaretUpDownIcon, CheckIcon, ScanIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { useCardScanner } from "@/hooks/use-card-scanner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RiderSelectProps {
  value: string | null;
  onChange: (riderId: string) => void;
  label?: string;
}

/** Longest list a search can usefully show before it's just scrolling. */
const MAX_RESULTS = 50;

/** Picks an existing rider by name (e-mail shown below it) — searchable by name, e-mail or phone (since `riders` now runs into the thousands, Grabby import) or by scanning their bracelet. */
export function RiderSelect({ value, onChange, label = "Naudotojas" }: RiderSelectProps) {
  const { riders, riderCards } = useAdmin();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  const selected = riders.find((r) => r.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q === "" ? riders : riders.filter((r) => `${r.name} ${r.surname}`.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(q));
    return rows.slice(0, MAX_RESULTS);
  }, [riders, query]);

  useCardScanner({
    enabled: scanning,
    onScan: (cardNumber) => {
      const binding = riderCards.find((c) => c.cardNumber === cardNumber);
      if (!binding) {
        setNotFound(cardNumber);
        return;
      }
      onChange(binding.riderId);
      setScanning(false);
      setNotFound(null);
      setOpen(false);
      setQuery("");
    },
  });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setScanning(false);
          setNotFound(null);
        }
      }}
    >
      <PopoverTrigger
        aria-label={label}
        disabled={riders.length === 0}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-expanded:border-ring"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected ? `${selected.name} ${selected.surname}` : "Pasirinkite naudotoją"}</span>
        <CaretUpDownIcon size={16} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="flex items-center gap-1.5 border-b border-border p-2">
          <Input autoFocus placeholder="Ieškoti pagal vardą, el. paštą ar telefoną" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-10" />
          <button
            type="button"
            aria-label={scanning ? "Baigti skenuoti" : "Skenuoti apyrankę"}
            aria-pressed={scanning}
            onClick={() => {
              setScanning((s) => !s);
              setNotFound(null);
            }}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
              scanning ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <ScanIcon size={18} />
          </button>
        </div>
        {scanning ? (
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <ScanIcon size={14} className="shrink-0 animate-pulse text-primary" />
            Priglauskite apyrankę prie skaitytuvo…
          </div>
        ) : null}
        {notFound ? (
          <div className="flex items-center gap-2 border-b border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <WarningCircleIcon size={14} className="shrink-0" />
            Apyrankė {notFound} nepriskirta jokiam naudotojui.
          </div>
        ) : null}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">Naudotojų nerasta.</p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm hover:bg-muted",
                  r.id === value && "bg-accent",
                )}
              >
                <span className="min-w-0 py-1.5">
                  <span className="block truncate">
                    {r.name} {r.surname}
                  </span>
                  {r.email ? <span className="block truncate text-xs text-muted-foreground">{r.email}</span> : null}
                </span>
                {r.id === value ? <CheckIcon size={16} className="shrink-0 text-primary" /> : null}
              </button>
            ))
          )}
          {filtered.length === MAX_RESULTS ? (
            <p className="px-2 py-2 text-center text-xs text-muted-foreground">Rodomi pirmi {MAX_RESULTS} rezultatai — siaurinkite paiešką.</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
