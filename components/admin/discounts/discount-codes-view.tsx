"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { DiscountCodeCard } from "./discount-code-card";
import { DiscountCodeDialog } from "./discount-code-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISCOUNT_STATE_LABEL, discountState, type DiscountCode, type DiscountState } from "@/lib/discount-codes";
import { todayKey } from "@/lib/sauna";

type Filter = DiscountState | "visi";
type Editing = { code?: DiscountCode } | null;

/** Discount codes for /rezervacija: create, edit, switch off, delete, and see how often each was used. */
export function DiscountCodesView() {
  const { discountCodes, setDiscountCodeActive, deleteDiscountCode } = useAdmin();
  const [filter, setFilter] = useState<Filter>("visi");
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<DiscountCode | null>(null);

  const today = todayKey();
  const withState = discountCodes.map((code) => ({ code, state: discountState(code, today) }));
  const states = Object.keys(DISCOUNT_STATE_LABEL) as DiscountState[];
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "visi", label: "Visi", count: withState.length },
    ...states.map((s) => ({ id: s, label: DISCOUNT_STATE_LABEL[s], count: withState.filter((c) => c.state === s).length })).filter((c) => c.count > 0 || c.id === filter),
  ];
  const rows = withState.filter((c) => filter === "visi" || c.state === filter);

  return (
    <AdminPage
      title="Nuolaidos"
      description="Nuolaidų kodai, kuriuos klientai įveda rezervuodami /rezervacija. Nuolaida skaičiuojama nuo kainos su PVM; dovanų kuponas taikomas likusiai sumai."
      actions={
        <Button onClick={() => setEditing({})}>
          <PlusIcon size={18} /> Naujas kodas
        </Button>
      }
    >
      {discountCodes.length > 0 ? (
        <div role="group" aria-label="Būsenos filtras" className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors ${filter === c.id ? "border-ink bg-ink text-foam" : "bg-card hover:bg-muted"}`}
            >
              {c.label}
              <span className={filter === c.id ? "text-foam/60" : "text-muted-foreground"}>{c.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ code, state }) => (
          <DiscountCodeCard
            key={code.id}
            code={code}
            state={state}
            onActive={async (active) => {
              const result = await setDiscountCodeActive(code.id, active);
              if ("data" in result) toast.success(active ? `${code.code}: įjungtas` : `${code.code}: išjungtas`);
            }}
            onEdit={() => setEditing({ code })}
            onDelete={() => setDeleting(code)}
          />
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{discountCodes.length === 0 ? "Nuolaidų kodų dar nėra." : "Pagal šį filtrą kodų nėra."}</p>
      ) : null}

      {editing ? <DiscountCodeDialog key={editing.code?.id ?? "new"} code={editing.code} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti kodą {deleting?.code}?</DialogTitle>
            <DialogDescription>
              {deleting && deleting.uses !== 0
                ? "Panaudoto kodo ištrinti negalima, nes dingtų jo panaudojimų skaičius. Tokį kodą išjunkite."
                : "Kodo nebus galima panaudoti."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                const target = deleting;
                setDeleting(null);
                const result = await deleteDiscountCode(target.id);
                if ("data" in result) toast.success(`${target.code}: ištrintas`);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
