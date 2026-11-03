"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowButton } from "@/components/booking/arrow-button";
import { ContactStep } from "@/components/booking/contact-step";
import { Cta } from "@/components/cta";
import { contactSchema, type ContactInput } from "@/lib/request-schema";
import {
  RESERVATION_DAYS,
  bookable,
  ACTIVITY_TAB_ORDER,
  ACTIVITY_TITLE,
  dayAvailability,
  extraOfferText,
  describePlans,
  offered,
  planAll,
  togglePick,
  totalOf,
  type ActivityId,
  type Picks,
  type ReservationData,
  type When,
} from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";
import type { DayIcon } from "@/components/booking/day-picker";
import { ActivitiesStep } from "./activities-step";
import { ACTIVITY_ICON } from "./activity-icons";
import { ExtrasOfferDialog } from "./extras-offer-dialog";
import { ActivityTabs } from "./activity-tabs";
import { PlanPanel } from "./plan-panel";
import { ReservationDone } from "./reservation-done";
import { ReviewStep } from "./review-step";
import { StepHeading } from "./step-heading";
import { submitReservation, type Outcome } from "./submit-reservation";
import { WhenStep } from "./when-step";

/** Selection, contact, review. */
const LAST = 2;

/** Headings of the steps after the selection (which starts straight with the list). */
const HEADINGS = [
  { eyebrow: "Kontaktai", title: "Kaip tave rasti?", text: "Telefonas jau patvirtintas. Pridėk vardą ir, jei nori, el. paštą." },
  { eyebrow: "Peržiūra", title: "Viskas gerai?", text: "Patikrink ir siųsk. Mokėti dabar nereikia." },
];

/** Activity tabs and date + group on top, then three steps: the chosen activity, contact, review. */
export function ReservationFlow({ header, data, photo }: { header: ReactNode; data: ReservationData; photo: { src: string; alt: string } }) {
  const { today } = data.sauna;
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const [step, setStep] = useState(0);
  const offer = offered(data);
  const tabs = ACTIVITY_TAB_ORDER.filter((id) => offer[id]);
  const [tab, setTab] = useState<ActivityId>(tabs[0]);
  const [date, setDate] = useState(days[0]);
  const [people, setPeople] = useState(2);
  const [picks, setPicks] = useState<Picks>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  /** The "we also have..." popup, and which activities it already offered ("<day>:<id>"): each is offered once per day. */
  const [offerOpen, setOfferOpen] = useState(false);
  const [alreadyOffered, setAlreadyOffered] = useState<string[]>([]);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "" },
  });

  const day = dateKey(date);
  const when: When = { day, people };
  const plans = planAll(picks, data, when);
  const lines = describePlans(plans);
  const total = totalOf(lines);
  const whenLabel = `${longDateLabel(date)}, ${people} žm.`;
  const facts = [
    { label: "Data", value: longDateLabel(date) },
    { label: "Žmonės", value: String(people) },
  ];
  /** Sauna, quad and stay icons under each day, lit when something is still free for this group. */
  const dayIcons = (d: Date): DayIcon[] => {
    const free = dayAvailability(data, dateKey(d), people);
    return tabs.map((id) => ({
      Icon: ACTIVITY_ICON[id],
      label: `${ACTIVITY_TITLE[id]} ${free[id] ? "laisva" : "užimta"}`,
      on: free[id],
    }));
  };
  const free = dayAvailability(data, day, people);
  const inPlan = tabs.filter((id) => picks[id] !== undefined);
  const offers = tabs
    .filter((id) => free[id] && picks[id] === undefined && !alreadyOffered.includes(`${day}:${id}`))
    .map((id) => ({ id, text: extraOfferText(id, data, inPlan) }));
  const ready = [bookable(plans), true, true][step];

  async function next() {
    if (!ready) return;
    // Other activities are free that day and not in the plan yet: offer each of them once before the contact step.
    if (step === 0 && offers.length) {
      setOfferOpen(true);
      return;
    }
    // The contact step must validate before the review is shown.
    if (step === 1 && !(await form.trigger())) return;
    setStep((s) => Math.min(LAST, s + 1));
  }

  const submit = form.handleSubmit(async (contact) => {
    setOutcome(await submitReservation(plans, when, contact, outcome?.sent ?? {}));
  });

  /** Enter in a field moves on until the review; only there does it send. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < LAST) void next();
    else void submit();
  }

  if (outcome) {
    return (
      <div className="space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        {header}
        <ReservationDone
          lines={lines}
          when={whenLabel}
          outcome={outcome}
          busy={form.formState.isSubmitting}
          onRetry={submit}
          onReset={() => {
            setOutcome(null);
            setPicks({});
            setStep(0);
            form.reset();
          }}
        />
      </div>
    );
  }

  const heading = step > 0 ? HEADINGS[step - 1] : null;
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="min-w-0 space-y-8 lg:col-span-2">
            {header}
            <ActivityTabs
              ids={tabs}
              active={tab}
              included={tabs.filter((id) => picks[id] !== undefined)}
              onChange={(id) => {
                setTab(id);
                setStep(0);
              }}
            />
            <WhenStep days={days} date={date} onDate={setDate} icons={dayIcons} people={people} onPeople={setPeople} />
            {heading ? <StepHeading step={step + 1} {...heading} /> : null}
            {step === 0 ? (
              <ActivitiesStep data={data} when={when} tab={tab} picks={picks} plans={plans} onToggle={(id) => setPicks((p) => togglePick(p, id, data))} onPick={setPicks} />
            ) : null}
            {step === 1 ? <ContactStep step={2} idPrefix="reservation" /> : null}
            {step === 2 ? <ReviewStep lines={lines} when={whenLabel} total={total} /> : null}
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center border-b border-current text-xs font-bold">
                  Atgal
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-4">
                <span className="font-display text-xl font-bold lg:hidden">{total} €</span>
                {step < LAST ? (
                  <Cta tone="dark" small disabled={!ready} onClick={() => void next()}>
                    Toliau
                  </Cta>
                ) : (
                  <ArrowButton type="submit" disabled={!bookable(plans) || form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Siunčiama..." : "Rezervuoti"}
                  </ArrowButton>
                )}
              </div>
            </div>
          </div>
          <PlanPanel photo={photo} facts={facts} lines={lines} total={total} />
        </div>
        <ExtrasOfferDialog
          open={offerOpen}
          offers={offers}
          onPick={(id) => {
            setAlreadyOffered((o) => [...o, ...offers.map((x) => `${day}:${x.id}`)]);
            setOfferOpen(false);
            setTab(id);
          }}
          onContinue={() => {
            setAlreadyOffered((o) => [...o, ...offers.map((x) => `${day}:${x.id}`)]);
            setOfferOpen(false);
            setStep(1);
          }}
        />
      </form>
    </FormProvider>
  );
}
