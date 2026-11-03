import Link from "next/link";

interface BookingHeaderProps {
  /** Last breadcrumb item (after "Marsas /"). */
  crumb: string;
  /** Small uppercase line with the water dot, on the left; the row is left out without it. */
  kicker?: string;
  /** Small uppercase line on the right (hidden on phones). */
  tagline?: string;
  /** One or two lines; the second is coral. */
  title: [string] | [string, string];
  intro: string;
}

/** Light page header of the booking-style pages (reservation, calculator): breadcrumb, kicker, big title, intro. */
export function BookingHeader({ crumb, kicker, tagline, title, intro }: BookingHeaderProps) {
  return (
    <header className="space-y-6">
      <nav aria-label="Naršymo kelias" className="flex items-center gap-3 text-micro text-lake-soft">
        <Link href="/" className="hover:text-rust">
          Marsas
        </Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{crumb}</span>
      </nav>
      {kicker ? (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-micro uppercase">
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="size-1.5 rounded-full bg-water ring-4 ring-water/15" />
            {kicker}
          </p>
          {tagline ? <p className="max-sm:hidden">{tagline}</p> : null}
        </div>
      ) : null}
      <h1 className="text-total font-bold uppercase max-sm:tracking-tighter sm:text-display">
        {title[0]}
        {title[1] ? (
          <>
            <br />
            <span className="text-rust">{title[1]}</span>
          </>
        ) : null}
      </h1>
      <p className="max-w-xl text-xs leading-loose text-lake-soft md:text-sm">{intro}</p>
    </header>
  );
}
