import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface RowControlsProps {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}

/** Move up, move down and remove for one row of an editable list. */
export function RowControls({ index, count, label, onMove, onRemove }: RowControlsProps) {
  return (
    <div className="flex shrink-0 items-center">
      <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`${label}: aukštyn`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ArrowUpIcon size={18} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`${label}: žemyn`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        <ArrowDownIcon size={18} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`${label}: pašalinti`} onClick={onRemove}>
        <TrashIcon size={18} />
      </Button>
    </div>
  );
}
