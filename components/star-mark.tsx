/** The eight-point Mars star used in the hero, ticker and footer; fill follows `currentColor`. */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} fill="currentColor">
      <path d="M50 0L58 35L85 15L65 42L100 50L65 58L85 85L58 65L50 100L42 65L15 85L35 58L0 50L35 42L15 15L42 35Z" />
    </svg>
  );
}
