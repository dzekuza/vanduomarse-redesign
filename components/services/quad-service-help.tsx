import { ClockCounterClockwiseIcon, IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr";

export function QuadServiceNotices() {
  return (
    <ul className="space-y-2 border-t border-line pt-4 text-xs text-copy">
      <li className="flex items-start gap-3">
        <ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" />
        <span>Nemokamas atšaukimas likus bent 48 val. iki pradžios.</span>
      </li>
      <li className="flex items-start gap-3">
        <IdentificationCardIcon size={18} aria-hidden className="shrink-0" />
        <span>Atvykdamas turėk asmens tapatybės dokumentą.</span>
      </li>
    </ul>
  );
}
