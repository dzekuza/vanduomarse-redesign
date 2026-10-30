/** Rental rules from /admin/keturraciai; renders nothing until staff set them. */
export function QuadRules({ rules }: { rules: string }) {
  if (!rules) return null;
  return (
    <section className="mt-8 border border-ink p-6">
      <h2 className="font-display text-sm font-bold">Taisyklės</h2>
      <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{rules}</p>
    </section>
  );
}
