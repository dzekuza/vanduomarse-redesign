import Image from "next/image";
import Link from "next/link";

/** Intrinsic size of public/brand/vanduo-marse-badge.svg (viewBox 0 0 85 110). */
const BADGE = { width: 85, height: 110 };

/** The Vanduo Marse astronaut badge, linking home. Height comes from `className`. */
export function BrandLogo({ className = "h-14 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Vanduo Marse, pradžia" className="inline-block shrink-0 transition-transform hover:-rotate-3 active:scale-95">
      <Image src="/brand/vanduo-marse-badge.svg" alt="Vanduo Marse" {...BADGE} priority={priority} className={className} />
    </Link>
  );
}
