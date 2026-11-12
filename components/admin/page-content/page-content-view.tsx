"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { PageEditor } from "./page-editor";
import { SERVICE_PAGES, isServiceSlug, type ServicePageCopy, type ServiceSlug } from "@/components/services/service-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SLUGS = Object.keys(SERVICE_PAGES) as ServiceSlug[];

/** `/admin/puslapiai`: owners edit the texts, FAQ and photos of every public service page. The chosen page is in `?puslapis=`. */
export function PageContentView() {
  const { pageContent } = useAdmin();
  const router = useRouter();
  const requested = useSearchParams().get("puslapis") ?? "";
  const slug: ServiceSlug = isServiceSlug(requested) ? requested : SLUGS[0];
  const copy: ServicePageCopy = SERVICE_PAGES[slug];

  return (
    <AdminPage
      title="Puslapiai"
      description="Keiskite paslaugų puslapių tekstus, DUK ir nuotraukas. Kainos, tvarkaraščiai ir laisvi laikai imami iš savo skilčių. Pakeitimai matomi lankytojams iškart."
      actions={
        <Button variant="outline" className="min-h-11" asChild>
          <a href={`/${slug}`} target="_blank" rel="noreferrer">
            <ArrowSquareOutIcon size={18} /> Atidaryti puslapį
          </a>
        </Button>
      }
    >
      <nav aria-label="Puslapiai" className="flex flex-wrap gap-2">
        {SLUGS.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={s === slug ? "default" : "outline"}
            className="min-h-11"
            aria-pressed={s === slug}
            onClick={() => router.replace(`/admin/puslapiai?puslapis=${s}`, { scroll: false })}
          >
            {SERVICE_PAGES[s].label}
            {pageContent[s] ? <Badge variant="secondary" className="ml-2">Pakeista</Badge> : null}
          </Button>
        ))}
      </nav>
      <p className="text-sm text-muted-foreground">
        /{slug} · {copy.label}
      </p>
      <PageEditor key={slug} slug={slug} />
    </AdminPage>
  );
}
