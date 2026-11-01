"use client";

import { useCallback, useEffect, useState } from "react";
import { loadBookingData, type BookableKind, type BookingData } from "@/app/actions/booking-data";
import { PhoneGate } from "@/components/booking/phone-gate";
import { SteppedBooking } from "@/components/booking/stepped";
import { CabinBooking } from "@/components/booking/cabin-booking";
import { SaunaReservation } from "@/components/booking/sauna-reservation";
import { Cta } from "@/components/cta";
import { QuadReservation } from "@/components/quads/quad-reservation";
import { QuadRules } from "@/components/quads/quad-rules";
import { Skeleton } from "@/components/ui/skeleton";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; booking: BookingData };

/** Loads the live availability for one activity and shows its real booking form, behind the phone check. */
export function ServiceBooking({ kind }: { kind: BookableKind }) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await loadBookingData(kind).catch(() => null);
    if (!result) return setState({ status: "error", message: "Nepavyko įkelti rezervacijos. Patikrinkite ryšį." });
    setState("error" in result ? { status: "error", message: result.error.message } : { status: "ready", booking: result.data });
  }, [kind]);

  useEffect(() => {
    // Fetch on mount (the dialog remounts this per activity); the state updates happen after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div role="status" aria-label="Kraunama rezervacija" className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div role="alert" className="space-y-4 border border-ink p-6">
        <p className="text-sm">{state.message}</p>
        <Cta tone="dark" small onClick={() => void load()}>
          Bandyti dar kartą
        </Cta>
      </div>
    );
  }

  const { booking } = state;
  return (
    <PhoneGate>
      <SteppedBooking>
      {booking.kind === "sauna" ? <SaunaReservation data={booking.data} days={booking.days} /> : null}
      {booking.kind === "cabins" ? <CabinBooking data={booking.data} days={booking.days} /> : null}
      {booking.kind === "ciongo" ? (
        <>
          <QuadReservation data={booking.data} />
          <QuadRules rules={booking.data.settings.rules} />
        </>
      ) : null}
      </SteppedBooking>
    </PhoneGate>
  );
}
