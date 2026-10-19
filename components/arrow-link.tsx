import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}

const SIZE = {
  sm: { box: "min-h-11 gap-3 px-4 text-xs", icon: 18 },
  md: { box: "min-h-12 gap-4 px-5 text-sm", icon: 22 },
};

/** Link styled as the live-site CTA: dark block, thin arrow, uppercase label. */
export function ArrowLink({ href, children, size = "md" }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center border border-ink bg-ink uppercase text-foam transition-[background-color,border-color,transform] hover:border-rust hover:bg-rust active:scale-[0.97] ${SIZE[size].box}`}
    >
      <ArrowRightIcon size={SIZE[size].icon} weight="thin" className="transition-transform group-hover:translate-x-1" />
      {children}
    </Link>
  );
}
