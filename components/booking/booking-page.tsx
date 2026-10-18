import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** Booking routes render inside `theme-marse`: the live vanduomarse.lt palette and type. */
export function BookingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-marse flex flex-1 flex-col">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
