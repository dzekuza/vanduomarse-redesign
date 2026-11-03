"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { SaunaForm } from "./sauna-form";
import { SaunaPhotosCard } from "./sauna-photos-card";
import { Button } from "@/components/ui/button";

/** `/admin/pirtis/nauja` (no id) or `/admin/pirtis/[id]`. Photos can be added once the sauna exists. */
export function SaunaEditor({ id }: { id?: string }) {
  const { saunas } = useAdmin();
  const sauna = id ? saunas.find((s) => s.id === id) : undefined;
  const back = (
    <Button variant="outline" asChild>
      <Link href="/admin/pirtis">
        <ArrowLeftIcon size={18} /> Visos pirtys
      </Link>
    </Button>
  );

  if (id && !sauna) {
    return (
      <AdminPage title="Pirtis nerasta" description="Ji galėjo būti ištrinta." actions={back}>
        {null}
      </AdminPage>
    );
  }

  return (
    <AdminPage title={sauna?.name ?? "Nauja pirtis"} description={sauna ? `Nuoroda svetainėje: /rezervacija?veikla=pirtis` : "Nuotraukas galėsite įkelti išsaugoję."} actions={back}>
      {sauna ? <SaunaPhotosCard sauna={sauna} /> : null}
      <SaunaForm key={sauna?.id ?? "new"} sauna={sauna} />
    </AdminPage>
  );
}
