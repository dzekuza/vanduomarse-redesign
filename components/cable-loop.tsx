const PATH = "M 10,110 C 10,40 390,40 390,110 C 390,180 10,180 10,110 Z";
const TOWERS = [
  { x: 10, y: 110 },
  { x: 70, y: 48 },
  { x: 330, y: 48 },
  { x: 390, y: 110 },
  { x: 330, y: 172 },
  { x: 70, y: 172 },
];

/** The park's actual 6-tower cable loop. One rider orbiting it is the hero's single motion moment. */
export function CableLoop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Kabelio trasos schema su šešiais bokštais">
      <path d={PATH} fill="none" stroke="var(--line)" strokeWidth={2} strokeDasharray="1 10" strokeLinecap="round" />
      {TOWERS.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={5} fill="var(--ink)" />
          <circle cx={t.x} cy={t.y} r={9} fill="none" stroke="var(--ink)" strokeOpacity={0.25} />
        </g>
      ))}
      <g className="cable-rider">
        <circle r={7} fill="var(--rust)" />
        <circle r={12} fill="none" stroke="var(--rust)" strokeWidth={1.5} strokeOpacity={0.4} />
      </g>
    </svg>
  );
}
