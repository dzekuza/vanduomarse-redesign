import { MainHeader } from "@/components/main-header";
import { SiteFooter } from "@/components/site-footer";

/** Page shell: skip link, ink header, content in `<main>`, footer. The live-brand theme comes from `theme-marse` on <body>. */
export function BookingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <a href="#turinys" className="sr-only focus:not-sr-only focus:fixed focus:top-2.5 focus:left-5 focus:z-50 focus:bg-dust focus:p-3">
        Pereiti prie turinio
      </a>
      <MainHeader />
      <main id="turinys" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
