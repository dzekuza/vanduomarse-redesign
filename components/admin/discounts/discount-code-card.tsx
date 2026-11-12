"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { StatusPill, type Tone } from "../status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatEuro } from "@/lib/coupons";
import { DISCOUNT_STATE_LABEL, discountDateLabel, discountServicesLabel, discountValueLabel, type DiscountCode, type DiscountState } from "@/lib/discount-codes";

/** In force = green, not yet valid = yellow, off or used up = grey, expired = red. */
const DISCOUNT_TONE: Record<DiscountState, Tone> = {
  aktyvus: "confirmed",
  dar_negalioja: "pending",
  isjungtas: "done",
  isnaudotas: "done",
  nebegalioja: "closed",
};

interface DiscountCodeCardProps {
  code: DiscountCode;
  state: DiscountState;
  onActive: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const validity = (c: DiscountCode) => {
  const from = c.validFrom ? discountDateLabel(c.validFrom) : null;
  const until = c.validUntil ? discountDateLabel(c.validUntil) : null;
  if (from && until) return `${from} – ${until}`;
  if (from) return `Nuo ${from}`;
  if (until) return `Iki ${until}`;
  return "Be termino";
};

/** One code: value, services, validity, usage; on/off switch, edit and delete. */
export function DiscountCodeCard({ code, state, onActive, onEdit, onDelete }: DiscountCodeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 font-display tracking-wide">
          <span className="min-w-0 wrap-anywhere">{code.code}</span>
          <StatusPill tone={DISCOUNT_TONE[state]} label={DISCOUNT_STATE_LABEL[state]} />
        </CardTitle>
        <CardDescription>
          {discountValueLabel(code)} · {discountServicesLabel(code.services)}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Switch checked={code.active} aria-label={`Kodas ${code.code} įjungtas`} onCheckedChange={onActive} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Veiksmai: ${code.code}`}>
                <DotsThreeIcon size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Redaguoti</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
                Ištrinti
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Galioja</dt>
          <dd>{validity(code)}</dd>
          <dt className="text-muted-foreground">Panaudota</dt>
          <dd className="tabular-nums">
            {code.uses ?? "—"}
            {code.maxUses !== null ? ` / ${code.maxUses}` : ""}
          </dd>
          <dt className="text-muted-foreground">Nuolaidų suma</dt>
          <dd className="tabular-nums">{code.discountTotal === null ? "—" : formatEuro(code.discountTotal)}</dd>
          {code.note ? (
            <>
              <dt className="text-muted-foreground">Pastaba</dt>
              <dd className="wrap-anywhere">{code.note}</dd>
            </>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
