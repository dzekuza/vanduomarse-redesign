"use client";

import {
  createContext,
  Suspense,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { QuadSchedule } from "@/components/services/quad-schedule";
import { SaunaServiceSchedule } from "@/components/services/sauna-service-schedule";
import { StayServiceSchedule } from "@/components/services/stay-service-schedule";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@/lib/customer-types";
import type {
  AvailabilityResponse,
  LiveActivity,
} from "@/lib/data/availability-response";
import type { ReservationData } from "@/lib/reservation";

/**
 * Service pages are cached (ISR) with the availability they were built with. This provider starts from that
 * snapshot and swaps in the live availability and the signed-in customer from /api/availability as soon as the
 * page loads (and again when the tab comes back to the front), so nobody books from a stale calendar.
 */
interface Live {
  data: ReservationData;
  customer: Customer | null;
}

const LiveContext = createContext<Live | null>(null);

function useLive(): Live {
  const live = use(LiveContext);
  if (!live)
    throw new Error(
      "LiveBooking and LiveSchedule must sit inside LiveActivityProvider.",
    );
  return live;
}

function merge(
  initial: ReservationData,
  response: AvailabilityResponse,
): ReservationData {
  if (response.activity === "pirtis")
    return { ...initial, sauna: response.data };
  if (response.activity === "nakvyne")
    return { ...initial, cabin: response.data };
  return { ...initial, quads: response.data };
}

export function LiveActivityProvider({
  activity,
  initial,
  children,
}: {
  activity: LiveActivity;
  initial: ReservationData;
  children: ReactNode;
}) {
  const [live, setLive] = useState<Live>({ data: initial, customer: null });

  useEffect(() => {
    let controller: AbortController | null = null;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(`/api/availability?activity=${activity}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as AvailabilityResponse;
        setLive({ data: merge(initial, body), customer: body.customer });
      } catch {
        // Offline or aborted: the page keeps the snapshot it has.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activity, initial]);

  return <LiveContext value={live}>{children}</LiveContext>;
}

function BookingFlow({
  activity,
  payments,
}: {
  activity: LiveActivity;
  payments: boolean;
}) {
  const { data, customer } = useLive();
  const eventId = useSearchParams().get("seansas");
  const initialDay =
    activity === "pirtis"
      ? data.sauna.events.find(({ key }) => key === eventId)?.date
      : undefined;
  return (
    <ReservationFlow
      activity={activity}
      header={null}
      data={data}
      initialDay={initialDay}
      payments={payments}
      initialCustomer={customer}
    />
  );
}

/** The activity's booking form. `?seansas=` is read in the browser, so the surrounding page stays cacheable. */
export function LiveBooking({
  activity,
  payments,
}: {
  activity: LiveActivity;
  payments: boolean;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-none" />}>
      <BookingFlow activity={activity} payments={payments} />
    </Suspense>
  );
}

function SaunaSchedule() {
  const { data } = useLive();
  const eventId = useSearchParams().get("seansas");
  return (
    <SaunaServiceSchedule
      data={data.sauna}
      initialDay={data.sauna.events.find(({ key }) => key === eventId)?.date}
    />
  );
}

/** The activity's availability calendar. */
export function LiveSchedule({ activity }: { activity: LiveActivity }) {
  const { data } = useLive();
  if (activity === "keturraciai") return <QuadSchedule data={data.quads} />;
  if (activity === "nakvyne") return <StayServiceSchedule data={data.cabin} />;
  return (
    <Suspense fallback={<SaunaServiceSchedule data={data.sauna} />}>
      <SaunaSchedule />
    </Suspense>
  );
}
