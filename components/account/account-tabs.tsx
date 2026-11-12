"use client";

import { CouponList } from "./coupon-list";
import { InquiryList } from "./inquiry-list";
import { RequestList } from "./request-list";
import { RiderPlans } from "./rider-plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MyCoupon, MyInquiry, MyRequest, MyRider, RequestKind } from "@/lib/account";

const TABS: { id: string; label: string; kinds?: readonly RequestKind[] }[] = [
  { id: "visi", label: "Visi" },
  { id: "pirtis", label: "Pirtis", kinds: ["pirtis"] },
  { id: "nakvyne", label: "Namukai", kinds: ["nakvyne"] },
  { id: "keturraciai", label: "Keturračiai", kinds: ["keturraciai"] },
  { id: "vandenlentes", label: "Vandenlentės" },
  { id: "pasiulymai", label: "Pasiūlymai" },
  { id: "kuponai", label: "Kuponai" },
];

/** The account's lists by category: every reservation, one category, or the calculator quotes. */
export function AccountTabs({ requests, inquiries, riders, coupons }: { requests: MyRequest[]; inquiries: MyInquiry[]; riders: MyRider[]; coupons: MyCoupon[] }) {
  const count = (id: string, kinds?: readonly RequestKind[]) =>
    id === "pasiulymai" ? inquiries.length : id === "kuponai" ? coupons.length : id === "vandenlentes" ? riders.length : kinds ? requests.filter((r) => kinds.includes(r.kind)).length : requests.length;

  return (
    <Tabs defaultValue="visi" className="min-w-0 gap-4">
      <TabsList aria-label="Rezervacijų skiltys" className="scrollbar-ink flex w-full justify-start overflow-x-auto overflow-y-hidden divide-x divide-line border border-line bg-transparent p-0 group-data-horizontal/tabs:h-auto">
        {TABS.map(({ id, label, kinds }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-full min-h-11 min-w-max flex-1 basis-0 rounded-none px-4 py-2 text-xs whitespace-nowrap text-ink data-active:bg-ink data-active:text-dust data-active:hover:text-dust"
          >
            {label} <span className="opacity-60">{count(id, kinds)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ id, kinds }) => (
        <TabsContent key={id} value={id}>
          {id === "kuponai" ? (
            <CouponList coupons={coupons} />
          ) : id === "pasiulymai" ? (
            <InquiryList inquiries={inquiries} />
          ) : id === "vandenlentes" ? (
            <RiderPlans riders={riders} />
          ) : (
            <RequestList requests={kinds ? requests.filter((r) => kinds.includes(r.kind)) : requests} filtered={!!kinds} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
