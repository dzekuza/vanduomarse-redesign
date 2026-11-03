import { OptionCard, OptionGroupLabel } from "@/components/reservation/option-card";
import { COUPON_SERVICE_LABEL, formatEuro, type CouponKind, type CouponProduct } from "@/lib/coupons";

const GROUPS: { kind: CouponKind; title: string }[] = [
  { kind: "verte", title: "Vertės kuponai" },
  { kind: "paslauga", title: "Patirtys" },
];

interface ProductPickerProps {
  products: CouponProduct[];
  value: string;
  onChange: (id: string) => void;
}

/** Coupon choice cards grouped by kind: the same `OptionCard` as the reservation steps. */
export function ProductPicker({ products, value, onChange }: ProductPickerProps) {
  return (
    <div className="space-y-8">
      {GROUPS.map(({ kind, title }) => {
        const items = products.filter((p) => p.kind === kind);
        if (!items.length) return null;
        return (
          <div key={kind} role="group" aria-label={title}>
            <OptionGroupLabel>{title}</OptionGroupLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((p) => (
                <OptionCard
                  key={p.id}
                  eyebrow={p.kind === "paslauga" ? COUPON_SERVICE_LABEL[p.service] : undefined}
                  title={p.name}
                  text={p.description}
                  meta={formatEuro(p.value)}
                  selected={value === p.id}
                  onClick={() => onChange(p.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
