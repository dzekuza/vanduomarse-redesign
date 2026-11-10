import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "coral" | "cream" | "dark";

const TONE: Record<Tone, string> = {
  coral: "bg-rust text-on-rust hover:bg-dust",
  cream: "bg-dust text-ink hover:bg-foam",
  dark: "bg-ink text-dust hover:bg-lake-soft",
};

const ARROW =
  "size-6 shrink-0 transition-transform duration-200 ease-out-strong motion-safe:group-hover/cta:-translate-y-1 motion-safe:group-hover/cta:translate-x-1";

interface CtaProps {
  tone: Tone;
  small?: boolean;
  className?: string;
  children: ReactNode;
}

/** Class list shared by the link and button flavours of the home page CTA. */
export function ctaClass({ tone, small, className }: Pick<CtaProps, "tone" | "small" | "className">): string {
  return cn(
    "group/cta h-auto justify-between rounded-none border-0 text-left whitespace-normal px-6 py-5 text-xs leading-snug font-bold transition-[background-color,translate,scale] duration-150 ease-out-strong motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-97",
    small ? "min-h-11 gap-5 px-4 py-3" : "min-h-15.5 gap-7",
    TONE[tone],
    className,
  );
}

/** Label left, arrow right. Renders a link when `href` is set, otherwise a button. */
export function Cta({ tone, small, className, children, href, ...props }: CtaProps & { href?: string } & Omit<ComponentProps<"button">, "className" | "children">) {
  const classes = ctaClass({ tone, small, className });
  const inner = (
    <>
      {children}
      <ArrowUpRightIcon aria-hidden className={ARROW} />
    </>
  );
  if (href) {
    const external = href.startsWith("http");
    return (
      <Button asChild className={classes}>
        <Link href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
          {inner}
        </Link>
      </Button>
    );
  }
  return (
    <Button type="button" className={classes} {...props}>
      {inner}
    </Button>
  );
}

/** Underlined text link with an arrow, for secondary actions. */
export function textCtaClass(className?: string): string {
  return cn(
    "group/cta inline-flex min-h-11 items-center gap-6 border-b border-current py-2.5 text-left text-xs font-bold transition-opacity duration-150 active:opacity-70",
    className,
  );
}

export function TextCtaArrow() {
  return <ArrowUpRightIcon aria-hidden className={ARROW} />;
}
