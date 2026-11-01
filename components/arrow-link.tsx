import { Cta } from "@/components/cta";

/** Link version of the primary CTA (dark block, label left, arrow right). */
export function ArrowLink({ href, children, size = "md" }: { href: string; children: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <Cta tone="dark" small={size === "sm"} href={href}>
      {children}
    </Cta>
  );
}
