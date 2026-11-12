"use client";

import { StatusTag } from "./status-tag";
import { XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Cta } from "@/components/cta";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MyInquiry } from "@/lib/account";
import { formatMoney } from "@/lib/event-pricing";
import { longDateLabel } from "@/lib/sauna";

const dayLabel = (key: string) => {
  if (!key) return "Data nepasirinkta";
  const [y, m, d] = key.split("-").map(Number);
  return longDateLabel(new Date(y, m - 1, d));
};

const GROUP_ORDER = ["Erdvė", "Maistas ir gėrimai", "Paslaugos", "Pramogos", "Nakvynė"];

/** The customer's calculator quotes: what they asked for, the estimate and where it stands. A card opens the whole quote. */
export function InquiryList({ inquiries }: { inquiries: MyInquiry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = inquiries.find((q) => q.id === openId) ?? null;

  if (inquiries.length === 0) {
    return (
      <div className="space-y-3 border border-line p-5 sm:p-6">
        <p className="text-copy">Pasiūlymų dar nėra. Suskaičiuok savo šventę skaičiuoklėje ir išsiųsk užklausą, ji atsiras čia.</p>
        <Link href="/sventes#rezervuoti" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
          Į skaičiuoklę
        </Link>
      </div>
    );
  }
  return (
    <>
      <ul className="divide-y divide-line border border-line">
        {inquiries.map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => setOpenId(q.id)}
              aria-label={`Atidaryti užklausą: ${q.eventType}, ${dayLabel(q.date)}`}
              className="flex w-full flex-wrap items-start justify-between gap-x-6 gap-y-2 p-5 text-left transition-colors duration-150 hover:bg-foam/30 focus-visible:bg-foam/30 focus-visible:outline-none"
            >
              <span className="min-w-0 space-y-1">
                <span className="block font-bold">{q.eventType}</span>
                <span className="block text-sm text-copy">{[dayLabel(q.date), `${q.guests} asm.`, q.space].filter(Boolean).join(", ")}</span>
                {q.accepted ? (
                  <span className="block text-sm">
                    <StatusTag tone="confirmed" label="Priimta, nameliai ir pirtys užimti" />
                  </span>
                ) : null}
              </span>
              <span className="flex flex-col items-end gap-1">
                {q.estimate ? <span className="font-display text-figure font-bold text-rust-ink">{formatMoney(q.estimate)}</span> : null}
                <span className="text-xs font-bold underline underline-offset-4">Visa informacija</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!open} onOpenChange={(next) => !next && setOpenId(null)}>
        <DialogContent showCloseButton={false} className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl">
          <DialogClose
            type="button"
            aria-label="Uždaryti"
            className="absolute top-2 right-2 z-10 grid size-11 place-items-center text-ink transition-colors duration-150 ease-out-strong hover:text-rust"
          >
            <XIcon size={20} aria-hidden />
          </DialogClose>
          {open ? <InquiryDetails inquiry={open} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InquiryDetails({ inquiry: q }: { inquiry: MyInquiry }) {
  const sent = new Date(q.createdAt).toLocaleDateString("lt-LT");
  const groups = GROUP_ORDER.filter((g) => q.lines.some((l) => l.group === g));
  const facts = [
    ["Data", dayLabel(q.date)],
    ["Svečių", `${q.guests} asm.`],
    ["Erdvė", q.space || "-"],
    ["Išsiųsta", sent],
  ];

  return (
    <div className="min-h-0 space-y-6 overflow-y-auto p-6">
      <header className="space-y-3 pr-10">
        <p className="text-micro uppercase text-copy">Skaičiuoklės užklausa</p>
        <DialogTitle className="font-display text-heading! font-bold uppercase">{q.eventType}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-copy">
          {q.accepted ? <StatusTag tone="confirmed" label="Priimta, nameliai ir pirtys užimti" /> : `Išsiųsta ${sent}`}
        </DialogDescription>
      </header>

      {q.estimate ? (
        <div className="space-y-1 border-y border-line py-5">
          <p className="text-micro uppercase text-copy">Preliminari kaina</p>
          <p className="font-display text-total font-bold">{formatMoney(q.estimate)}</p>
          <p className="text-xs text-copy">Kainos su 21% PVM. Tai orientacinė sąmata, ne pasiūlymas.</p>
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-micro uppercase text-copy">{k}</dt>
            <dd className="mt-1 font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      {groups.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-item font-bold">Sąmata</h3>
          {groups.map((group) => (
            <dl key={group}>
              <dt className="mb-2 text-micro font-bold uppercase text-ink">{group}</dt>
              {q.lines
                .filter((l) => l.group === group)
                .map((l) => (
                  <dd key={l.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-xs last:border-0">
                    <span className="text-ink/80">{l.label}</span>
                    <span className="shrink-0 font-bold tabular-nums">{formatMoney(l.amount)}</span>
                  </dd>
                ))}
            </dl>
          ))}
        </section>
      ) : null}

      {q.message ? (
        <section className="space-y-2">
          <h3 className="text-item font-bold">Tavo komentaras</h3>
          <blockquote className="border-l-2 border-rust pl-3 text-sm">{q.message}</blockquote>
        </section>
      ) : null}

      <section className="space-y-1 border-t border-line pt-4 text-sm">
        <h3 className="text-item font-bold">Kontaktai</h3>
        <p>{[q.contact.name, q.contact.email, q.contact.phone].filter(Boolean).join(" · ")}</p>
        <p className="text-xs text-copy">Susisieksime šiais kontaktais.</p>
      </section>

      <DialogClose asChild>
        <Cta tone="dark" small className="w-full">Uždaryti</Cta>
      </DialogClose>
    </div>
  );
}
