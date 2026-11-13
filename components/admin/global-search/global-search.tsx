"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "../admin-store";
import { useSaleDetails } from "../overview/sale-details";
import { MIN_QUERY, SEARCH_GROUPS, searchAdmin } from "@/lib/admin/global-search";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Search over everything the admin holds (customers, reservations, rentals, tickets, events, coupons, inquiries).
 * The header shows an input-shaped button (an icon on phones) that opens the palette; Ctrl/⌘ + K does too. A result
 * opens its panel in place or goes to its page; arrow keys move, Enter opens.
 */
export function GlobalSearch() {
  const { riders, bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, inquiries } = useAdmin();
  const { openSale, sheets } = useSaleDetails();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const deferred = useDeferredValue(query);

  const hits = useMemo(
    () => searchAdmin({ riders, bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, inquiries }, deferred),
    [riders, bookings, stayTypes, quadRentals, quadTypes, tourTickets, eventTickets, events, coupons, inquiries, deferred],
  );
  const searching = deferred.trim().length >= MIN_QUERY;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active, hits]);

  const change = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const pick = (index: number) => {
    const hit = hits[index];
    if (!hit) return;
    change(false);
    openSale(hit.target);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(active);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-h-11 w-56 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none md:flex xl:w-72"
      >
        <MagnifyingGlassIcon size={18} aria-hidden />
        <span className="flex-1 text-left">Ieškoti…</span>
        <kbd className="rounded border border-border bg-background px-1.5 text-xs">⌘K</kbd>
      </button>
      <Button type="button" variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Paieška" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon size={20} />
      </Button>

      <Dialog open={open} onOpenChange={change}>
        <DialogContent showCloseButton={false} className="top-16 translate-y-0 gap-0 p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Paieška</DialogTitle>
          <DialogDescription className="sr-only">Ieškokite klientų, rezervacijų, keturračių, bilietų, renginių, kuponų ir užklausų.</DialogDescription>
          <div className="flex items-center gap-2 border-b px-3">
            <MagnifyingGlassIcon size={20} className="shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="admin-search-results"
              aria-label="Paieška"
              autoComplete="off"
              placeholder="Vardas, telefonas, el. paštas ar numeris"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div id="admin-search-results" role="listbox" className="max-h-96 overflow-y-auto p-2">
            {!searching ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Ieškokite pagal vardą, telefoną, el. paštą, rezervacijos ar kupono numerį.</p>
            ) : hits.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nieko nerasta.</p>
            ) : (
              SEARCH_GROUPS.map((group) => {
                const rows = hits.map((hit, index) => ({ hit, index })).filter(({ hit }) => hit.group === group.id);
                if (rows.length === 0) return null;
                return (
                  <div key={group.id} role="group" aria-label={group.label} className="pb-1">
                    <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                    {rows.map(({ hit, index }) => (
                      <button
                        key={hit.key}
                        ref={index === active ? activeRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={index === active}
                        onMouseMove={() => setActive(index)}
                        onClick={() => pick(index)}
                        className={cn("flex min-h-11 w-full flex-col justify-center rounded-md px-2 py-1.5 text-left", index === active && "bg-muted")}
                      >
                        <span className="truncate text-sm font-medium">{hit.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      {sheets}
    </>
  );
}
