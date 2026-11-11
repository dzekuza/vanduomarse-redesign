"use client";

import { AdminPage } from "../admin-page";
import { SalesFilters } from "./sales-filters";
import { SalesStats } from "./sales-stats";
import { SalesTable } from "./sales-table";
import { useSales } from "./use-sales";

/** Admin landing: the money (filters, stats, every sale) (filters, stats, every sale). */
export function Overview() {
  const sales = useSales();
  return (
    <AdminPage title="Apžvalga" description="Pardavimų suvestinė ir visi pardavimai.">
      <section aria-labelledby="sales-heading" className="space-y-4">
        <h2 id="sales-heading" className="font-heading text-item font-bold">
          Pardavimai
        </h2>
        <SalesFilters value={sales.filters} onChange={sales.setFilters} />
        <SalesStats stats={sales.stats} />
        <SalesTable key={JSON.stringify(sales.filters)} all={sales.all} filters={sales.filters} />
      </section>
    </AdminPage>
  );
}
