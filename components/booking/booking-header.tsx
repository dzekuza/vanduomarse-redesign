import Link from "next/link";
import { cn } from "@/lib/utils";

interface BookingHeaderProps {
  /** Last breadcrumb item (after "Marsas /"). */
  crumb: string;
  /** Small uppercase line with the water dot, on the left; the row is left out without it. */
  kicker?: string;
  /** Small uppercase line on the right (hidden on phones). */
  tagline?: string;
  /** One or two lines; the second is coral. */
  title: [string] | [string, string];
  /** One paragraph, or several as an array. */
  intro?: string | string[];
  /** The header sits in a half-width column (from `lg`): a smaller title keeps long words inside it. */
  split?: boolean;
  /** Extra classes for the intro paragraphs, e.g. a max width narrower than a wide title above them. */
  introClassName?: string;
}

export function BookingBreadcrumb({ crumb }: { crumb: string }) {
  return (
    <nav aria-label="Naršymo kelias" className="flex items-center gap-3 text-micro text-copy">
      <Link href="/" className="hover:text-rust">Marsas</Link>
      <span aria-hidden>/</span>
      <span aria-current="page">{crumb}</span>
    </nav>
  );
}

/** Light page header of the booking-style pages (reservation, calculator): breadcrumb, kicker, big title, intro. */
export function BookingHeader({ crumb, kicker, tagline, title, intro, split = false, introClassName }: BookingHeaderProps) {
  return (
    <header className="space-y-6">
      <BookingBreadcrumb crumb={crumb} />
      {kicker ? (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-micro uppercase">
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="size-1.5 rounded-full bg-water ring-4 ring-water/15" />
            {kicker}
          </p>
          {tagline ? <p className="max-sm:hidden">{tagline}</p> : null}
        </div>
      ) : null}
      <h1 className={`text-total font-bold uppercase max-sm:tracking-tighter sm:text-display${split ? " lg:text-display-split" : ""}`}>
        {title[0]}
        {title[1] ? (
          <>
            <br />
            <span className="text-rust">{title[1]}</span>
          </>
        ) : null}
      </h1>
      {[intro ?? []].flat().map((paragraph) => (
        <p key={paragraph} className={cn("text-xs leading-loose text-copy md:text-sm", introClassName)}>
          {paragraph}
        </p>
      ))}
    </header>
  );
}
