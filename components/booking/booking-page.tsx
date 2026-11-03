import { MainHeader } from "@/components/main-header";
import { SiteFooter } from "@/components/site-footer";

/** Page shell: ink header, content, footer. The live-brand theme comes from `theme-marse` on <body>. */
export function BookingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <MainHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
