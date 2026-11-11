"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { saveCustomerName } from "@/app/actions/customer";
import { startReservationCheckout } from "@/app/actions/payments";
import { WakeServiceBooking } from "@/components/services/wake-service-booking";
import { ACADEMY_CONTACT } from "@/lib/contacts";
import type { CouponProduct } from "@/lib/coupons";
import { QuadServiceBooking } from "@/components/quads/quad-service-booking";
import { quadTourPlan, type QuadTourPick } from "@/components/quads/quad-tour-plan";
import { SaunaServiceBooking } from "@/components/services/sauna-service-booking";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import { customerNameSchema } from "@/lib/customer-schema";
import type { Customer } from "@/lib/customer-types";
import { discountFor, isDiscountService, type CheckedDiscount } from "@/lib/discount-codes";
import {
  RESERVATION_DAYS,
  bookable,
  chosen,
  ACTIVITY_TAB_ORDER,
  ACTIVITY_TITLE,
  dayAvailability,
  defaultPick,
  describePlans,
  offered,
  planAll,
  planHours,
  sessionRows,
  totalOf,
  type ActivityId,
  type Picks,
  type ReservationData,
  type When,
} from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";
import type { AccountValues } from "./account-step";
import { ActivitiesStep } from "./activities-step";
import { ActivityAbout } from "./activity-about";
import { ActivityTabs, type ReservationTab } from "./activity-tabs";
import { activityPhotos } from "./activity-photos";
import { MobilePlanDock } from "./mobile-plan-dock";
import { PlanPanel } from "./plan-panel";
import { planQuantities } from "./plan-quantities";
import { ReservationDone } from "./reservation-done";
import { ReservationAccountDialog } from "./reservation-account-dialog";
import { requestsFor, submitReservation, type Outcome } from "./submit-reservation";
import type { ReservationDayDetails } from "./day-cell";
import { WhenStep, type StayDatePhase } from "./when-step";

/** Selection, then verified contact and final submission inside the dialog. */
const accountSchema = z.object({ customerName: customerNameSchema, discountCode: z.string().trim().max(40, "Per ilgas kodas.") });

/** Database hints that mean the applied code no longer holds: shown on the code field. */
const DISCOUNT_HINTS = new Set(["discount_invalid", "discount_used_up"]);

const LAST = 1;

/** Activity choices stay visible behind the phone/email reservation dialog. */
export function ReservationFlow({
  header,
  data,
  initialTab,
  wakeProducts,
  initialDay,
  activity,
  payments,
  initialCustomer,
}: {
  header: ReactNode;
  data: ReservationData;
  initialTab?: ReservationTab;
  wakeProducts?: CouponProduct[];
  initialDay?: string;
  /** On a service page the booking is limited to that activity. */
  activity?: "pirtis" | "nakvyne" | "keturraciai";
  /** Pay at submit through Stripe Checkout; off when Stripe is not configured. */
  payments: boolean;
  /** Already signed in (a returning customer); otherwise the account step asks for a code. */
  initialCustomer: Customer | null;
}) {
  const { today } = data.sauna;
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const [step, setStep] = useState(0);
  const [payOnSite, setPayOnSite] = useState(false);
  const selectionHeader = useRef<HTMLDivElement>(null);
  const inlinePlan = useRef<HTMLElement>(null);
  const offer = offered(data);
  const tabs = activity ? [activity] : ACTIVITY_TAB_ORDER.filter((id) => offer[id]);
  const availableTabs: ReservationTab[] = wakeProducts ? [...tabs, "wake"] : tabs;
  const [selectedTab, setTab] = useState<ReservationTab>(initialTab && availableTabs.includes(initialTab) ? initialTab : tabs[0]);
  const sessionId = useSearchParams().get("seansas");
  const activeTab = activity ?? (sessionId && offer.pirtis ? "pirtis" : selectedTab);
  const wake = activeTab === "wake" && wakeProducts;
  const tab = activeTab === "wake" ? tabs[0] : activeTab;
  const [date, setDate] = useState(() => days.find((candidate) => dateKey(candidate) === initialDay) ?? days[0]);
  const [dayChosen, setDayChosen] = useState(() => days.some((candidate) => dateKey(candidate) === initialDay));
  const [draftNights, setDraftNights] = useState(1);
  const [stayDatePhase, setStayDatePhase] = useState<StayDatePhase>("idle");
  const [people, setPeople] = useState(1);
  const [picks, setPicks] = useState<Picks>({});
  /** A Mini / Midi / Maxi tour; it takes the quad activity's place in the plan and is filed as a tour request. */
  const [tourPick, setTourPick] = useState<QuadTourPick | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  /** Stripe accepted the payment: the browser is on its way to Checkout. */
  const [redirecting, setRedirecting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { customerName: initialCustomer?.name ?? "", discountCode: "" },
  });
  const [appliedDiscount, setDiscount] = useState<CheckedDiscount | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const onCheckingCode = useCallback((checking: boolean) => setCheckingCode(checking), []);

  const day = dateKey(date);
  const stayNights = picks.nakvyne?.nights ?? draftNights;
  const stayDates = nextDays(day, MAX_STAY_NIGHTS + 1);
  const stayEnd = stayDatePhase !== "idle" ? stayDates[stayNights] : null;
  const showStayDates = picks.nakvyne !== undefined || (step === 0 && tab === "nakvyne");
  const when: When = { day, people };
  const plans = planAll(picks, data, when);
  const quadTour = quadTourPlan(data.quads, when, tourPick, planHours(plans.pirtis));
  const lines = describePlans(plans, when);
  if (quadTour) lines.unshift(quadTour.line);
  const total = totalOf(lines);
  const discount = appliedDiscount;
  // Preview only: each request's database function prices the code again.
  const discountAmount = discount
    ? Math.round(lines.reduce((sum, line) => sum + (isDiscountService(line.id) ? discountFor(discount, line.id, line.price) : 0), 0) * 100) / 100
    : 0;
  const tracksPeople = Boolean(plans.pirtis && plans.pirtis.mode !== "private");
  const dateLabel = longDateLabel(date);
  const checkoutLabel = showStayDates && stayEnd ? longDateLabel(stayEnd) : null;
  const datesLabel = checkoutLabel ? `${dateLabel} iki ${checkoutLabel}` : dateLabel;
  const whenLabel = tracksPeople ? `${datesLabel}, ${people} žm.` : datesLabel;
  /**
   * Per-day marks for the active tab: whether it is still free (faded days are not) and, for the sauna and quads,
   * how many scheduled sessions or tour departures there are.
   */
  const dayDetails = (d: Date): ReservationDayDetails => {
    const key = dateKey(d);
    const available = dayAvailability(data, key, people, stayEnd ? stayNights : 1)[tab];
    const status = `${ACTIVITY_TITLE[tab]} ${available ? "laisva" : "užimta"}`;
    if (tab === "nakvyne") return { label: status, available };
    const count = tab === "pirtis" ? data.sauna.events.filter((e) => e.date === key).length : data.quads.departures.filter((x) => x.date === key).length;
    // An empty marker keeps every day the same height, with or without sessions.
    if (count === 0) return { label: status, available, indicator: <span className="block h-3" /> };
    const noun = tab === "pirtis" ? (count === 1 ? "seansas" : count < 10 ? "seansai" : "seansų") : count === 1 ? "turas" : count < 10 ? "turai" : "turų";
    return {
      label: `${status}, ${count} ${noun}`,
      available,
      indicator: (
        <span className="flex items-center justify-center gap-1 text-micro font-bold text-rust-ink group-aria-pressed/day:text-dust">
          <span aria-hidden className="size-1.5 rounded-full bg-rust" />
          {count}
        </span>
      ),
    };
  };
  const inPlan = tabs.filter((id) => picks[id] !== undefined || (id === "keturraciai" && tourPick !== null));
  const selectionReady = tourPick === null
    ? bookable(plans)
    : Boolean(quadTour?.ok && (chosen(plans).length === 0 || bookable(plans)));
  const ready = selectionReady && customer !== null;
  const busy = form.formState.isSubmitting || redirecting;

  function selectDate(next: Date) {
    if (busy) return;
    if (dateKey(next) !== day) {
      setTourPick(null);
      // An hourly rental keeps its quads and duration, but its start belongs to the old day.
      setPicks((current) => current.keturraciai ? { ...current, keturraciai: { ...current.keturraciai, startHour: null } } : current);
    }
    setStep(0);
    setDate(next);
  }

  function updateStayNights(nights: number) {
    setDraftNights(nights);
    setPicks((current) => current.nakvyne && current.nakvyne.nights !== nights
      ? { ...current, nakvyne: { ...current.nakvyne, nights } }
      : current);
  }

  function selectStayDate(next: Date) {
    if (busy) return;
    setStep(0);
    const key = dateKey(next);
    if (stayDatePhase !== "selectingEnd" || key <= day) {
      if (key !== day) setTourPick(null);
      setDate(next);
      updateStayNights(1);
      setStayDatePhase("selectingEnd");
      return;
    }

    const nights = stayDates.findIndex((candidate) => dateKey(candidate) === key);
    if (nights < 1) return;
    updateStayNights(nights);
    setStayDatePhase("complete");
  }

  function removeActivity(id: ActivityId) {
    if (id === "keturraciai" && tourPick) {
      if (busy) return;
      setTourPick(null);
      setStep(0);
      return;
    }
    if (busy || !picks[id]) return;
    setStep(0);
    setPicks((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
    if (id === "pirtis") setPeople(1);
  }

  const editPicks: typeof setPicks = (next) => {
    if (busy) return;
    setStep(0);
    setPicks(next);
  };
  const editPeople: typeof setPeople = (next) => {
    if (busy) return;
    setStep(0);
    setPeople(next);
  };

  const privateSauna = plans.pirtis?.mode === "private" ? plans.pirtis : null;
  const privateStarts = privateSauna
    ? sessionRows(data.sauna, day, [...planHours(plans.keturraciai), ...(quadTour?.hours ?? [])])
      .find((row) => row.mode === "private" && row.programId === privateSauna.program.id)?.startHours ?? []
    : [];
  const quantities = planQuantities(plans, data, when, editPicks, editPeople);
  if (tourPick && quadTour && quadTour.maxUnits > 0) {
    quantities.keturraciai = [{
      id: "tour",
      label: "Keturračių kiekis",
      value: tourPick.units,
      min: quadTour.route.minUnits,
      max: quadTour.maxUnits,
      onChange: (units) => {
        if (busy) return;
        setStep(0);
        setTourPick((current) => current ? { ...current, units } : current);
      },
    }];
  }
  const planDetails = {
    lines,
    total,
    quantities,
    saunaTime: privateSauna ? {
      value: privateSauna.startHour,
      starts: privateStarts,
      onChange: (startHour: number) => {
        if (busy || !privateStarts.includes(startHour)) return;
        setStep(0);
        setPicks((current) => current.pirtis ? { ...current, pirtis: { ...current.pirtis, startHour } } : current);
      },
    } : undefined,
    busy,
    onRemove: removeActivity,
  };

  function next(cash = payOnSite) {
    if (!selectionReady || busy) return;
    setPayOnSite(cash);
    setStep(LAST);
  }

  const submit = form.handleSubmit(async ({ customerName }) => {
    if (!customer) {
      setStep(1);
      return;
    }
    void saveCustomerName(customerName).catch(() => null);
    // The server files every request for the signed-in account (its confirmed phone and email, read
    // from the session); the contact below only has to pass the same schemas as the other forms.
    // A code that covers everything leaves nothing to pay online: file the requests unpaid instead.
    if (payOnSite || !payments || total - discountAmount <= 0) {
      const contact = {
        customerName,
        customerPhone: customer.phone ?? "",
        customerEmail: customer.email ?? "",
        viaAccount: true,
      };
      const result = await submitReservation(plans, when, contact, outcome?.sent ?? {}, discount, tourPick);
      // The code stopped holding (used up, expired) part-way: drop it so "Bandyti dar kartą" files the rest without it.
      if (DISCOUNT_HINTS.has(result.error?.code ?? "")) setDiscount(null);
      setOutcome(result);
      return;
    }
    // Pay at submit: the server files every request and opens Checkout, or files nothing.
    form.clearErrors("root");
    const result = await startReservationCheckout({ contact: { customerName, discountCode: discount?.code }, requests: requestsFor(plans, when, tourPick) });
    if ("error" in result) {
      if (DISCOUNT_HINTS.has(result.error.code ?? "")) {
        // The code stopped holding between the check and the payment (used up, expired): ask again.
        setDiscount(null);
        form.setError("discountCode", { message: result.error.message });
        return;
      }
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

  /** Only the dialog's final form can submit a verified customer's plan. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === LAST && ready && !busy) void submit();
  }

  if (outcome) {
    return (
      // On a service page the flow sits inside the booking panel, which already has its own padding.
      <div className={activity ? undefined : "space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24"}>
        {activity ? null : header}
        <ReservationDone
          compact={Boolean(activity)}
          lines={lines}
          outcome={outcome}
          payOnSite={payOnSite}
          busy={form.formState.isSubmitting}
          onRetry={submit}
          onReset={() => {
            setOutcome(null);
            setPayOnSite(false);
            setPicks({});
            setPeople(1);
            setDraftNights(1);
            setStayDatePhase("idle");
            setStep(0);
            setDiscount(null);
            form.reset({ customerName: customer?.name ?? "", discountCode: "" });
          }}
        />
      </div>
    );
  }

  const continueAction = { label: "Rezervuoti", disabled: !selectionReady || busy, onClick: () => next(false) };
  const secondaryAction = { label: "Atsiskaitysiu vietoj grynais", disabled: !selectionReady || busy, onClick: () => next(true) };
  const photos = activityPhotos(tab, data);
  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => {
        event.preventDefault();
        next();
      }} noValidate className={activity ? undefined : "px-gutter pt-10 pb-16 md:pt-14 md:pb-24"}>
        <div className={activity ? "grid gap-6" : "grid gap-10 lg:grid-cols-3 lg:gap-12"}>
          <div className={activity ? "min-w-0 space-y-5" : "min-w-0 space-y-8 lg:col-span-2"}>
            {activity === "pirtis" || activity === "keturraciai" ? null : <div ref={selectionHeader} tabIndex={-1} className="scroll-mt-32 outline-none">{header}</div>}
            {activity ? null : <ActivityTabs
              ids={availableTabs}
              active={activeTab}
              included={inPlan}
              renderDetails={(id, active) => <ActivityAbout id={id} data={data} active={active} />}
              onChange={(id) => {
                if (busy) return;
                setTab(id);
                setStep(0);
              }}
            />}
            {wake ? <WakeServiceBooking products={wake} contact={ACADEMY_CONTACT} /> : activity === "pirtis" ? <SaunaServiceBooking
              data={data.sauna}
              days={days}
              date={dayChosen ? date : null}
              plan={plans.pirtis}
              pick={picks.pirtis ?? defaultPick("pirtis", data)}
              people={people}
              busy={busy}
              sessionId={sessionId}
              onDate={(next) => {
                if (busy) return;
                setDayChosen(true);
                if (dateKey(next) !== day) removeActivity("pirtis");
                selectDate(next);
              }}
              onPick={(pirtis, count) => {
                editPicks((current) => ({ ...current, pirtis }));
                if (count !== undefined) editPeople(count);
              }}
              onPeople={editPeople}
              onRemove={() => removeActivity("pirtis")}
              onSelectedFocus={() => inlinePlan.current?.focus()}
            /> : activity === "keturraciai" ? <QuadServiceBooking
              data={data.quads}
              days={days}
              date={dayChosen ? date : null}
              pick={tourPick}
              busy={busy}
              onDate={(next) => {
                if (busy) return;
                setDayChosen(true);
                selectDate(next);
              }}
              onPick={(next) => {
                if (busy) return;
                setStep(0);
                setTourPick(next);
                if (next) setPicks((current) => {
                  const rest = { ...current };
                  delete rest.keturraciai;
                  return rest;
                });
              }}
            /> : <>
              {/* With the month calendar open and room to spare, the day's results sit beside it instead of below. */}
              <div className="@container">
                <div className="grid grid-cols-1 gap-8 has-[[data-view=calendar]]:@4xl:grid-cols-[3fr_2fr] has-[[data-view=calendar]]:@4xl:items-start">
                  <WhenStep
                    days={days}
                    date={date}
                    onDate={selectDate}
                    dayDetails={dayDetails}
                    compact={Boolean(activity)}
                    stay={tab === "nakvyne" ? { phase: stayDatePhase, end: stayEnd, lastEnd: stayDates[MAX_STAY_NIGHTS], onSelect: selectStayDate } : undefined}
                  />
                  <ActivitiesStep
                    data={data}
                    when={when}
                    tab={tab}
                    sessionId={sessionId}
                    onSessionSelectedFocus={activity ? () => inlinePlan.current?.focus() : undefined}
                    onSessionDay={(key) => {
                      const next = days.find((candidate) => dateKey(candidate) === key);
                      if (next && !busy) {
                        setTab("pirtis");
                        selectDate(next);
                      }
                    }}
                    picks={picks}
                    plans={plans}
                    stayNights={stayEnd ? stayNights : null}
                    tourPick={tourPick}
                    tourHours={quadTour?.hours ?? []}
                    onTourPick={(next) => {
                      if (busy) return;
                      setStep(0);
                      setTourPick(next);
                      if (next) setPicks((current) => {
                        const remaining = { ...current };
                        delete remaining.keturraciai;
                        return remaining;
                      });
                    }}
                    onRemove={removeActivity}
                    onPick={editPicks}
                    onPeople={editPeople}
                  />
                </div>
              </div>
            </>}
          </div>
          {(!wake || lines.length > 0) && <PlanPanel ref={activity ? inlinePlan : undefined} activity={tab} photos={photos} inline={Boolean(activity)} continueAction={continueAction} secondaryAction={secondaryAction} {...planDetails} />}
        </div>
      </form>
      {activity || (wake && lines.length === 0) ? null : <MobilePlanDock activity={tab} photos={photos} whenLabel={whenLabel} continueAction={continueAction} secondaryAction={secondaryAction} {...planDetails} />}
      <ReservationAccountDialog
        open={step === LAST}
        onClose={() => { if (!busy) setStep(0); }}
        onReturnToPlan={() => (activity ? inlinePlan.current : selectionHeader.current)?.focus({ preventScroll: true })}
        customer={customer}
        onCustomer={setCustomer}
        lines={lines}
        total={total}
        discount={discount}
        discountAmount={discountAmount}
        onDiscount={(next) => {
          form.clearErrors("discountCode");
          setDiscount(next);
        }}
        checkingCode={checkingCode}
        onCheckingCode={onCheckingCode}
        payments={payments}
        payOnSite={payOnSite}
        ready={ready}
        busy={busy}
        redirecting={redirecting}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
}
