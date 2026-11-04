import styles from "./hero-orbits.module.css";

const ORBITS_ART = "/landing/hero-orbits.svg";

/** The two rings travel around the dashed guide while their satellites counter-rotate. */
export function HeroOrbits() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1212 1528"
      fill="none"
      className={`hero-orbits ${styles.stage} pointer-events-none absolute left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 overflow-visible text-dust opacity-50`}
    >
      <use className="orbit-guide" href={`${ORBITS_ART}#dashed-ring`} />
      <g className="orbit-rings">
        <use href={`${ORBITS_ART}#upper-ring`} />
        <use className="orbit-satellite-upper" href={`${ORBITS_ART}#upper-satellite`} />
        <use href={`${ORBITS_ART}#lower-ring`} />
        <use className="orbit-satellite-lower" href={`${ORBITS_ART}#lower-satellite`} />
      </g>
    </svg>
  );
}
