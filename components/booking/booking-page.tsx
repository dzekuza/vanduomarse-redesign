import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** Page shell: header, content, footer. The live-brand theme comes from `theme-marse` on <body>. */
export function BookingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
