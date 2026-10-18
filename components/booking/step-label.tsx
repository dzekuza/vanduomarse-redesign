export function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-baseline gap-3 text-sm font-semibold uppercase">
      <span className="font-display text-rust">{String(step).padStart(2, "0")}</span>
      <span>{children}</span>
    </p>
  );
}
