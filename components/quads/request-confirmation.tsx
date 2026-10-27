interface Row {
  label: string;
  value: string;
}

interface RequestConfirmationProps {
  title: string;
  reference: string;
  rows: Row[];
  total: number;
  resetLabel: string;
  onReset: () => void;
}

/** Ticket-style confirmation for a request that staff still have to confirm. */
export function RequestConfirmation({ title, reference, rows, total, resetLabel, onReset }: RequestConfirmationProps) {
  return (
    <div role="status" className="border border-ink bg-foam">
      <div className="flex items-center justify-between gap-4 border-b border-dashed border-ink px-6 py-4">
        <span className="font-display text-lg font-bold">{title}</span>
        <span className="font-display text-lg font-bold text-rust">{reference}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 text-sm sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-ink/50">{r.label}</dt>
            <dd className="mt-1 font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-4 border-t border-dashed border-ink px-6 py-4">
        <p className="text-sm text-ink/70">Užklausą gavome. Patvirtinsime telefonu arba el. paštu; kol kas vieta dar nėra garantuota.</p>
        <p className="font-display text-2xl font-bold">{total} €</p>
      </div>
      <div className="border-t border-ink px-6 py-4">
        <button type="button" onClick={onReset} className="min-h-11 text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-rust">
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
