interface BookingCardProps {
  children: React.ReactNode;
  /** Left side of the footer bar: what is selected and the running total. */
  summary: React.ReactNode;
  /** Right side of the footer bar, usually the confirm button. */
  action: React.ReactNode;
}

/** Outlined booking form shell: step content on top, total and confirm bar below. */
export function BookingCard({ children, summary, action }: BookingCardProps) {
  return (
    <div className="border border-ink bg-foam">
      <div className="space-y-8 px-6 py-8 sm:px-8">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink bg-dust-soft px-6 py-5 sm:px-8">
        <div>{summary}</div>
        {action}
      </div>
    </div>
  );
}

export function BookingTotal({ note, total }: { note: string; total: number }) {
  return (
    <>
      <p className="text-sm text-ink/60">{note}</p>
      <p className="font-display text-2xl font-bold">{total} €</p>
    </>
  );
}
