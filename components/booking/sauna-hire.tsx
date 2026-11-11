"use client";

import { useState } from "react";
import { SaunaBooking } from "./sauna-booking";
import { SaunaPicker } from "./sauna-picker";
import { StepLabel } from "./step-label";
import type { SaunaPageData } from "@/lib/data/public-types";

interface SaunaHireProps {
  data: SaunaPageData;
  days: number;
  /** `?pirtis=<id>`; ignored when no active sauna has that id. */
  initialSaunaId?: string;
}

/** Private hire: pick a sauna (when there is more than one), then book it. */
export function SaunaHire({ data, days, initialSaunaId }: SaunaHireProps) {
  const { saunas, comingSoonSaunas } = data;
  const [saunaId, setSaunaId] = useState(() => (saunas.some((s) => s.id === initialSaunaId) ? initialSaunaId : saunas[0]?.id));
  const sauna = saunas.find((s) => s.id === saunaId);

  if (!sauna) {
    return (
      <div className="space-y-4">
        <p className="border border-ink bg-foam p-6 text-ink">Pirtis šiuo metu nerezervuojama internetu. Skambinkite, ir susitarsime.</p>
        {comingSoonSaunas.length ? <SaunaPicker saunas={[]} comingSoon={comingSoonSaunas} /> : null}
      </div>
    );
  }

  const picker = saunas.length + comingSoonSaunas.length > 1;
  return (
    <SaunaBooking
      key={sauna.id}
      today={data.today}
      nowHour={data.nowHour}
      days={days}
      sauna={sauna}
      upsells={data.upsells.filter((u) => sauna.upsellIds.includes(u.id))}
      takenByDay={data.takenBySauna[sauna.id] ?? {}}
      firstStep={picker ? 2 : 1}
      lead={
        picker ? (
          <div>
            <StepLabel step={1}>Pasirink pirtį</StepLabel>
            <SaunaPicker saunas={saunas} comingSoon={comingSoonSaunas} selected={sauna.id} onSelect={setSaunaId} />
          </div>
        ) : null
      }
    />
  );
}
