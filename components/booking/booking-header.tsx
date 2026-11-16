import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface BookingHeaderProps {
  /** Last breadcrumb item (after "Marsas /"). */
  crumb: string;
  /** Small uppercase line with the water dot, on the left; the row is left out without it. */
  kicker?: string;
  /** Small uppercase line on the right (hidden on phones). */
  tagline?: string;
  /** A plain second line is coral; an element can set its own emphasis. */
  title: [string] | [string, string | ReactElement];
  /** One paragraph, or several as an array. */
  intro?: string | string[];
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

export function BookingTitle({ title: [first, second] }: Pick<BookingHeaderProps, "title">) {
  return (
    <h1 className="text-total font-bold tracking-tighter uppercase sm:text-title">
      {first}
      {second ? <><br />{typeof second === "string" ? <span className="text-rust">{second}</span> : second}</> : null}
    </h1>
  );
}

/** Light page header for public booking pages: breadcrumb, kicker, title and intro. */
export function BookingHeader({ crumb, kicker, tagline, title, intro, introClassName }: BookingHeaderProps) {
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
      <BookingTitle title={title} />
      {[intro ?? []].flat().map((paragraph) => (
        <p key={paragraph} className={cn("text-xs leading-loose text-copy md:text-sm", introClassName)}>
          {paragraph}
        </p>
      ))}
    </header>
  );
}
