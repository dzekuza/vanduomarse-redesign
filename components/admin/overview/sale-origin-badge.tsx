import { GlobeSimpleIcon, UserGearIcon } from "@phosphor-icons/react";
import { BOOKING_SOURCE } from "@/lib/admin/labels";
import { SALE_ORIGIN_LABEL, saleOrigin } from "@/lib/admin/sales";
import type { BookingSource } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";

/** "Internetu" for a sale the customer made on the site, "Admin" for one staff entered (the tooltip says by phone or on site). */
export function SaleOriginBadge({ source }: { source: BookingSource }) {
  const origin = saleOrigin(source);
  const Icon = origin === "admin" ? UserGearIcon : GlobeSimpleIcon;
  return (
    <Badge variant={origin === "admin" ? "secondary" : "outline"} title={origin === "admin" ? `Įvedė administracija: ${BOOKING_SOURCE[source].toLowerCase()}` : "Klientas rezervavo svetainėje"}>
      <Icon aria-hidden /> {SALE_ORIGIN_LABEL[origin]}
    </Badge>
  );
}
