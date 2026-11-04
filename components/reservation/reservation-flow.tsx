"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { saveCustomerName } from "@/app/actions/customer";
import { startReservationCheckout } from "@/app/actions/payments";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Cta } from "@/components/cta";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import { customerNameSchema } from "@/lib/customer-schema";
import type { Customer } from "@/lib/customer-types";
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
  totalOf,
  type ActivityId,
  type Picks,
  type ReservationData,
  type When,
} from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";
import type { DayIcon } from "@/components/booking/day-picker";
import { AccountStep, type AccountValues } from "./account-step";
import { ActivitiesStep } from "./activities-step";
import { ACTIVITY_ICON } from "./activity-icons";
import { ExtrasOfferDialog } from "./extras-offer-dialog";
import { ActivityAbout } from "./activity-about";
import { ActivityTabs } from "./activity-tabs";
import { MobilePlanDock } from "./mobile-plan-dock";
import { PlanPanel } from "./plan-panel";
import { planQuantities } from "./plan-quantities";
import { ReservationDone } from "./reservation-done";
import { ReviewStep } from "./review-step";
import { StepHeading } from "./step-heading";
import { requestsFor, submitReservation, type Outcome } from "./submit-reservation";
import { WhenStep, type StayDatePhase } from "./when-step";

/** Selection, account, review. */
const accountSchema = z.object({ customerName: customerNameSchema });

const LAST = 2;

/** Headings of the steps after the selection (which starts straight with the list). */
const headings = (payments: boolean) => [
  {
    eyebrow: "Prisijungimas",
    title: "Prisijunk arba susikurk paskyrą",
    text: "Atsiųsime vienkartinį kodą telefonu ar el. paštu. Jei paskyros dar nėra, ją sukursime, o rezervacijas rasi toje pačioje paskyroje.",
  },
  {
    eyebrow: "Peržiūra",
    title: "Viskas gerai?",
    text: payments ? "Patikrink ir mokėk saugiai per Stripe. Vietas laikome, kol mokėjimas baigiasi." : "Patikrink ir siųsk. Mokėti dabar nereikia.",
  },
];

/** Activity tabs and date on top, then the chosen activity, account and review. */
export function ReservationFlow({
  header,
  data,
  photo,
  initialTab,
  payments,
  initialCustomer,
}: {
  header: ReactNode;
  data: ReservationData;
  photo: { src: string; alt: string };
  initialTab?: ActivityId;
  /** Pay at submit through Stripe Checkout; off when Stripe is not configured. */
  payments: boolean;
  /** Already signed in (a returning customer); otherwise the account step asks for a code. */
  initialCustomer: Customer | null;
}) {
  const { today } = data.sauna;
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const [step, setStep] = useState(0);
  const offer = offered(data);
  const tabs = ACTIVITY_TAB_ORDER.filter((id) => offer[id]);
  const [tab, setTab] = useState<ActivityId>(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
  const [date, setDate] = useState(days[0]);
  const [draftNights, setDraftNights] = useState(1);
  const [stayDatePhase, setStayDatePhase] = useState<StayDatePhase>("idle");
  const [people, setPeople] = useState(1);
  const [picks, setPicks] = useState<Picks>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  /** Stripe accepted the payment: the browser is on its way to Checkout. */
  const [redirecting, setRedirecting] = useState(false);
  /** The "we also have..." popup, and which activities it already offered ("<day>:<id>"): each is offered once per day. */
  const [offerOpen, setOfferOpen] = useState(false);
  const [alreadyOffered, setAlreadyOffered] = useState<string[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { customerName: initialCustomer?.name ?? "" },
  });

  const day = dateKey(date);
  const stayNights = picks.nakvyne?.nights ?? draftNights;
  const stayDates = nextDays(day, MAX_STAY_NIGHTS + 1);
  const stayEnd = stayDatePhase === "complete" ? stayDates[stayNights] : null;
  const incompleteStay = picks.nakvyne !== undefined && !stayEnd;
  const showStayDates = stayDatePhase !== "idle" && (picks.nakvyne !== undefined || (step === 0 && tab === "nakvyne"));
  const when: When = { day, people };
  const plans = planAll(incompleteStay ? { ...picks, nakvyne: undefined } : picks, data, when);
  const lines = describePlans(plans);
  if (incompleteStay) {
    lines.push({ id: "nakvyne", title: ACTIVITY_TITLE.nakvyne, detail: "Pasirink išvykimo datą.", price: 0 });
  }
  const total = totalOf(lines);
  const tracksPeople = picks.pirtis !== undefined;
  const dateLabel = longDateLabel(date);
  const checkoutLabel = showStayDates && stayEnd ? longDateLabel(stayEnd) : null;
  const datesLabel = checkoutLabel ? `${dateLabel} iki ${checkoutLabel}` : dateLabel;
  const whenLabel = tracksPeople ? `${datesLabel}, ${people} žm.` : datesLabel;
  const facts = [
    { label: showStayDates ? "Atvykimas" : "Data", value: dateLabel },
    ...(checkoutLabel ? [{ label: "Išvykimas", value: checkoutLabel }] : []),
    ...(tracksPeople ? [{ label: "Žmonės", value: String(people) }] : []),
  ];
  /** Sauna, quad and stay icons under each day, lit when something is still free. */
  const dayIcons = (d: Date): DayIcon[] => {
    const free = dayAvailability(data, dateKey(d), people, stayEnd ? stayNights : 1);
    return tabs.map((id) => ({
      Icon: ACTIVITY_ICON[id],
      label: `${ACTIVITY_TITLE[id]} ${free[id] ? "laisva" : "užimta"}`,
      on: free[id],
    }));
  };
  const free = dayAvailability(data, day, people, stayEnd ? stayNights : 1);
  const inPlan = tabs.filter((id) => picks[id] !== undefined);
  const offers = tabs
    .filter((id) => free[id] && picks[id] === undefined && !alreadyOffered.includes(`${day}:${id}`))
    .map((id) => ({ id, text: extraOfferText(id, data, inPlan) }));
  const ready = !incompleteStay && bookable(plans) && (step === 0 || customer !== null);
  const busy = form.formState.isSubmitting || redirecting;

  function selectStayDate(next: Date) {
    if (busy) return;
    const key = dateKey(next);
    if (stayDatePhase !== "selectingEnd" || key <= day) {
      setDate(next);
      setStayDatePhase("selectingEnd");
      return;
    }

    const nights = stayDates.findIndex((candidate) => dateKey(candidate) === key);
    if (nights < 1) return;
    if (picks.nakvyne) {
      setPicks((current) => current.nakvyne ? { ...current, nakvyne: { ...current.nakvyne, nights } } : current);
    } else {
      setDraftNights(nights);
    }
    setStayDatePhase("complete");
  }

  function removeActivity(id: ActivityId) {
    if (busy || !picks[id]) return;
    setPicks((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
    if (id === "pirtis") setPeople(1);
    if (id === "nakvyne") setDraftNights(stayNights);
    if (inPlan.length === 1) setStep(0);
  }

  const planDetails = {
    facts,
    lines,
    total,
    quantities: planQuantities(plans, data, when, setPicks, setPeople),
    busy,
    onRemove: removeActivity,
  };

  async function next() {
    if (!ready || busy) return;
    // Other activities are free that day and not in the plan yet: offer each once before the account step.
    if (step === 0 && offers.length) {
      setOfferOpen(true);
      return;
    }
    // The account step needs a signed-in customer with a name before the review is shown.
    if (step === 1) {
      if (!(await form.trigger())) return;
      void saveCustomerName(form.getValues("customerName")).catch(() => null);
    }
    setStep((s) => Math.min(LAST, s + 1));
  }

  const submit = form.handleSubmit(async ({ customerName }) => {
    if (!customer) {
      setStep(1);
      return;
    }
    // The server files every request for the signed-in account (its confirmed phone and email, read
    // from the session); the contact below only has to pass the same schemas as the other forms.
    if (!payments) {
      const contact = { customerName, customerPhone: customer.phone ?? "", customerEmail: customer.email ?? "", viaAccount: true };
      setOutcome(await submitReservation(plans, when, contact, outcome?.sent ?? {}));
      return;
    }
    // Pay at submit: the server files every request and opens Checkout, or files nothing.
    form.clearErrors("root");
    const result = await startReservationCheckout({ contact: { customerName }, requests: requestsFor(plans, when) });
    if ("error" in result) {
      form.setError("root", { message: result.error.message });
      if (result.error.code === "unauthorized") {
        setCustomer(null);
        setStep(1);
      }
      return;
    }
    setRedirecting(true);
    window.location.assign(result.data.url);
  });

  /** Enter in a field moves on until the review; only there does it send. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < LAST) void next();
    else if (ready && !busy) void submit();
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
            setPeople(1);
            setDraftNights(1);
            setStayDatePhase("idle");
            setStep(0);
            form.reset({ customerName: customer?.name ?? "" });
          }}
        />
      </div>
    );
  }

  const heading = step > 0 ? headings(payments)[step - 1] : null;
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
              renderDetails={(id, active) => <ActivityAbout id={id} data={data} active={active} />}
              onChange={(id) => {
                if (busy) return;
                setTab(id);
                setStep(0);
              }}
            />
            <WhenStep
              days={days}
              date={date}
              onDate={(next) => { if (!busy) setDate(next); }}
              icons={dayIcons}
              stay={tab === "nakvyne" ? { phase: stayDatePhase, end: stayEnd, lastEnd: stayDates[MAX_STAY_NIGHTS], onSelect: selectStayDate } : undefined}
            />
            {heading ? <StepHeading step={step + 1} {...heading} /> : null}
            {step === 0 ? (
              <ActivitiesStep data={data} when={when} tab={tab} picks={picks} plans={plans} stayNights={stayEnd ? stayNights : null} onRemove={removeActivity} onPick={setPicks} onPeople={setPeople} />
            ) : null}
            {step === 1 ? <AccountStep customer={customer} onCustomer={setCustomer} /> : null}
            {step === 2 ? <ReviewStep lines={lines} when={whenLabel} total={total} payments={payments} customer={customer} /> : null}
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" disabled={busy} onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center border-b border-current text-xs font-bold">
                  Atgal
                </button>
              ) : (
                <span />
              )}
              {step < LAST ? (
                <Cta tone="dark" small disabled={!ready || busy} onClick={() => void next()}>
                  Toliau
                </Cta>
              ) : (
                <ArrowButton type="submit" disabled={!ready || busy}>
                  {redirecting ? "Nukreipiame į mokėjimą..." : form.formState.isSubmitting ? "Siunčiama..." : payments ? `Mokėti ${total} €` : "Rezervuoti"}
                </ArrowButton>
              )}
            </div>
          </div>
          <PlanPanel activity={tab} {...planDetails} />
        </div>
        <ExtrasOfferDialog
          open={offerOpen}
          offers={offers}
          photo={photo}
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
      <MobilePlanDock activity={tab} whenLabel={whenLabel} {...planDetails} />
    </FormProvider>
  );
}
