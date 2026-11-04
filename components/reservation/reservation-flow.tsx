"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { saveCustomerName } from "@/app/actions/customer";
import { startReservationCheckout } from "@/app/actions/payments";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Cta } from "@/components/cta";
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
  togglePick,
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
import { ReservationDone } from "./reservation-done";
import { ReviewStep } from "./review-step";
import { StepHeading } from "./step-heading";
import { requestsFor, submitReservation, type Outcome } from "./submit-reservation";
import { WhenStep } from "./when-step";

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

/** Activity tabs and date + group on top, then three steps: the chosen activity, contact, review. */
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
  const [people, setPeople] = useState(2);
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
  const when: When = { day, people };
  const plans = planAll(picks, data, when);
  const lines = describePlans(plans);
  const total = totalOf(lines);
  const tracksPeople = tab !== "nakvyne" || picks.pirtis !== undefined || picks.keturraciai !== undefined;
  const dateLabel = longDateLabel(date);
  const whenLabel = tracksPeople ? `${dateLabel}, ${people} žm.` : dateLabel;
  const facts = [
    { label: "Data", value: dateLabel },
    ...(tracksPeople ? [{ label: "Žmonės", value: String(people) }] : []),
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
  const ready = [bookable(plans), customer !== null, true][step];

  async function next() {
    if (!ready) return;
    // Other activities are free that day and not in the plan yet: offer each of them once before the contact step.
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
                setTab(id);
                setStep(0);
              }}
            />
            <WhenStep days={days} date={date} onDate={setDate} icons={dayIcons} people={people} onPeople={setPeople} showPeople={tab === "keturraciai" || (step !== 0 && tracksPeople)} />
            {heading ? <StepHeading step={step + 1} {...heading} /> : null}
            {step === 0 ? (
              <ActivitiesStep data={data} when={when} tab={tab} picks={picks} plans={plans} onToggle={(id) => setPicks((p) => togglePick(p, id, data))} onPick={setPicks} onPeople={setPeople} />
            ) : null}
            {step === 1 ? <AccountStep customer={customer} onCustomer={setCustomer} /> : null}
            {step === 2 ? <ReviewStep lines={lines} when={whenLabel} total={total} payments={payments} customer={customer} /> : null}
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center border-b border-current text-xs font-bold">
                  Atgal
                </button>
              ) : (
                <span />
              )}
              {step < LAST ? (
                <Cta tone="dark" small disabled={!ready} onClick={() => void next()}>
                  Toliau
                </Cta>
              ) : (
                <ArrowButton type="submit" disabled={!bookable(plans) || form.formState.isSubmitting || redirecting}>
                  {redirecting ? "Nukreipiame į mokėjimą..." : form.formState.isSubmitting ? "Siunčiama..." : payments ? `Mokėti ${total} €` : "Rezervuoti"}
                </ArrowButton>
              )}
            </div>
          </div>
          <PlanPanel activity={tab} facts={facts} lines={lines} total={total} />
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
      <MobilePlanDock activity={tab} whenLabel={whenLabel} facts={facts} lines={lines} total={total} />
    </FormProvider>
  );
}
