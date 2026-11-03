"use client";

import { Stepper } from "@/components/booking/stepper";
import { CABIN_SIZES, CAMPER_MAX_GUESTS, ROOM_TYPES } from "@/lib/cabin";
import type { StayPick, StayPlan, When } from "@/lib/reservation";
import { OptionCard, OptionGroupLabel } from "./option-card";

interface StayOptionsProps {
  plan: StayPlan;
  when: When;
  /** Already in the plan: only then are the cabin size and nights shown. */
  included: boolean;
  onChange: (pick: StayPick) => void;
}

/** Cabin (2 or 4 beds) or camper pitch, and how many nights from the chosen day. */
export function StayOptions({ plan, when, included, onChange }: StayOptionsProps) {
  const pick: StayPick = { roomId: plan.roomId, size: plan.size, nights: plan.nights };
  return (
    <>
      <div>
        <OptionGroupLabel>Tipas</OptionGroupLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROOM_TYPES.map((r) => (
            <OptionCard
              key={r.id}
              eyebrow="Nakvynė"
              title={r.label}
              text={r.note}
              meta={`${r.id === "namelis" ? "nuo " : ""}${r.pricePerNight} € / naktį`}
              selected={included && plan.roomId === r.id}
              onClick={() => onChange({ ...pick, roomId: r.id })}
            />
          ))}
        </div>
      </div>
      {included ? (
        <>
        {plan.roomId === "namelis" ? (
          <div>
            <OptionGroupLabel>Namelio dydis</OptionGroupLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {CABIN_SIZES.map((s) => {
                const left = plan.free(s.id);
                const small = s.id < when.people;
                return (
                  <OptionCard
                    key={s.id}
                    eyebrow={small ? "Per mažas grupei" : left > 0 ? `liko ${left}` : "Užimta"}
                    title={s.label}
                    meta={`${s.pricePerNight} € / naktį`}
                    selected={plan.size === s.id}
                    disabled={small || left === 0}
                    onClick={() => onChange({ ...pick, size: s.id })}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
        {!plan.ok ? (
          <p role="status" className="text-sm text-rust-ink">
            {plan.roomId === "namelis" ? "Šioms naktims tinkamo namelio nebeliko. Pakeisk naktų skaičių ar tipą." : `Kemperio aikštelėje telpa iki ${CAMPER_MAX_GUESTS} žmonių.`}
          </p>
        ) : null}
        <Stepper label="Naktys" value={plan.nights} onChange={(nights) => onChange({ ...pick, nights })} min={1} max={14} />
        </>
      ) : null}
    </>
  );
}
