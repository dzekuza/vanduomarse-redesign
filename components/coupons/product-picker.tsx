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

/** Radio tiles grouped by kind. Real radio inputs, so arrow keys and screen readers just work. */
export function ProductPicker({ products, value, onChange }: ProductPickerProps) {
  return (
    <div className="space-y-8">
      {GROUPS.map(({ kind, title }) => {
        const items = products.filter((p) => p.kind === kind);
        if (!items.length) return null;
        return (
          <fieldset key={kind}>
            <legend className="mb-3 text-xs uppercase">{title}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((p) => (
                <label key={p.id} className="group relative block cursor-pointer">
                  <input
                    type="radio"
                    name="product"
                    value={p.id}
                    checked={value === p.id}
                    onChange={() => onChange(p.id)}
                    className="peer sr-only"
                  />
                  <span className="flex h-full min-h-11 flex-col justify-between gap-6 rounded-tile bg-card p-5 transition-[color,background-color,transform] active:scale-[0.98] peer-checked:bg-ink peer-checked:text-foam peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 md:p-6">
                    <span>
                      <span className="block font-display text-sm font-bold">{p.name}</span>
                      <span className="mt-2 block text-sm opacity-70">{p.description}</span>
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="font-wordmark text-5xl">{formatEuro(p.value)}</span>
                      {p.kind === "paslauga" ? <span className="text-xs uppercase opacity-70">{COUPON_SERVICE_LABEL[p.service]}</span> : null}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
