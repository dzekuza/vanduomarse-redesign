"use client";

import { InfoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { PriceGroupForm } from "./price-group-form";
import type { PriceGroup } from "@/lib/admin/types";

const GROUPS: PriceGroup[] = ["Erdvės", "Maitinimas", "Paslaugos", "Pramogos", "Nakvynė"];

/** Price list editor, grouped like the 2026–27 price sheet. */
export function PricingView() {
  const { prices } = useAdmin();
  return (
    <AdminPage title="Kainodara" description="Kainos su 21% PVM, galioja iki 2027-12-31. Intervalai rodomi kaip „nuo – iki“.">
      <div className="flex gap-3 border border-ink/20 bg-muted p-4 text-sm">
        <InfoIcon size={20} className="mt-0.5 shrink-0 text-rust" />
        <p>
          Pradinės reikšmės paimtos iš svetainės kainodaros. Kol duomenų bazė neprijungta, pakeitimai galioja tik šioje sesijoje ir
          svetainės bei skaičiuoklės kainų nekeičia. Pirties kainos ir papildomos paslaugos –{" "}
          <Link href="/admin/pirtis" className="underline underline-offset-4 hover:text-rust">
            skiltyje „Pirtis“
          </Link>
          .
        </p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {GROUPS.map((g) => (
          <PriceGroupForm key={g} group={g} items={prices.filter((p) => p.group === g)} />
        ))}
      </div>
    </AdminPage>
  );
}
