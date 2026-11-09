"use client";

import { CalendarCheckIcon, CoinsIcon, EnvelopeSimpleIcon, HourglassIcon, IdentificationBadgeIcon, TicketIcon, UsersIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { BookingStatusBadge, InquiryStatusBadge } from "../status-badge";
import { useNavCounts } from "../use-nav-counts";
import { StatCard } from "./stat-card";
import { bookingTypeLabel, bookingWhen, formatDateTime, formatDay, formatEur } from "@/lib/admin/format";
import { dateKey } from "@/lib/sauna";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function nextDays(n: number): string[] {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)));
}

/** Admin landing: today's load, work waiting on staff, money, and what's next. */
export function Overview() {
  const { bookings, inquiries, events, saunas, riders, riderCards, ridePlans, purchases } = useAdmin();
  const counts = useNavCounts();
  const [today, ...rest] = nextDays(7);
  const week = [today, ...rest];
  const month = today.slice(0, 7);

  const live = bookings.filter((b) => b.status !== "atsaukta");
  const todays = live.filter((b) => b.date === today).sort((a, b) => (a.startHour ?? 99) - (b.startHour ?? 99));
  const fresh = inquiries.filter((q) => q.status === "nauja");
  const revenue = live.filter((b) => b.date.startsWith(month)).reduce((sum, b) => sum + b.total, 0);
  const saunaHours = live.filter((b) => b.kind === "pirtis" && week.includes(b.date)).reduce((s, b) => s + (b.hours ?? 0), 0);
  // Open hours of every bookable sauna over the week.
  const openHours = saunas.filter((s) => s.active).reduce((sum, s) => sum + (s.rates.closeHour - s.rates.openHour), 0) * week.length;
  const occupancy = openHours ? Math.round((saunaHours / openHours) * 100) : 0;
  const upcoming = events.filter((e) => e.date >= today && e.published).slice(0, 4);

  const activeSubscriptions = riders.filter((r) => {
    const plan = ridePlans.find((p) => p.id === r.planId);
    return plan?.category === "Abonementai";
  }).length;
  const todaysSales = purchases.filter((p) => p.soldAt.startsWith(today));
  const todaysSalesRevenue = todaysSales.reduce((sum, p) => sum + (p.price ?? 0), 0);

  return (
    <AdminPage title="Apžvalga" description="Šiandienos darbai, laukiantys sprendimai ir artimiausi renginiai.">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Šiandien" value={String(todays.length)} hint={`Pirties užimtumas 7 d.: ${occupancy}%`} icon={CalendarCheckIcon} />
        <StatCard label="Laukia patvirtinimo" value={String(counts.pendingAll)} hint="Rezervacijos, kuponai, keturračiai ir užklausos" icon={HourglassIcon} />
        <StatCard label="Naujos užklausos" value={String(fresh.length)} hint="Renginiai ir skaičiuoklė" icon={EnvelopeSimpleIcon} />
        <StatCard label="Šio mėnesio suma" value={formatEur(revenue)} hint="Patvirtintos ir įvykdytos" icon={CoinsIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Šiandienos tvarkaraštis</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {todays.length === 0 ? <p className="text-sm text-muted-foreground">Šiandien rezervacijų nėra.</p> : null}
            {todays.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {bookingTypeLabel(b)} · {bookingWhen(b)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.customer.name}{b.guests === null ? "" : ` · ${b.guests} asm.`}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Naujausios užklausos</CardTitle>
            <Link href="/admin/uzklausos" className="text-sm underline underline-offset-4 hover:text-rust">
              Visos
            </Link>
          </CardHeader>
          <CardContent className="divide-y">
            {inquiries.slice(0, 5).map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {q.eventType} · {q.guests} asm.
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {q.customer.name} · {formatDateTime(q.createdAt)}
                  </p>
                </div>
                <InquiryStatusBadge status={q.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Artimiausi renginiai</CardTitle>
          <Link href="/admin/renginiai" className="text-sm underline underline-offset-4 hover:text-rust">
            Valdyti
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {upcoming.map((e) => (
            <div key={e.id} className="border p-3">
              <p className="text-xs text-muted-foreground">
                {formatDay(e.date)}, {e.time}
              </p>
              <p className="mt-1 text-sm font-medium">{e.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {e.capacity ? `Parduota ${e.sold} / ${e.capacity}` : "Be vietų limito"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Apyrankės</h2>
        <Link href="/admin/apyrankes" className="text-sm underline underline-offset-4 hover:text-rust">
          Valdyti
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Apyrankės priskirtos" value={String(riderCards.length)} hint="Aktyvūs naudotojai su apyranke" icon={IdentificationBadgeIcon} />
        <StatCard label="Aktyvūs abonementai" value={String(activeSubscriptions)} hint="Naudotojai su abonemento planu" icon={TicketIcon} />
        <StatCard label="Naudotojai iš viso" value={String(riders.length)} hint="Registruota sistemoje" icon={UsersIcon} />
        <StatCard label="Šiandien parduota" value={String(todaysSales.length)} hint={`Suma: ${formatEur(todaysSalesRevenue)}`} icon={CoinsIcon} />
      </div>
    </AdminPage>
  );
}
