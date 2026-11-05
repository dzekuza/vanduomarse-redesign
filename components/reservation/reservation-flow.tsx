"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { saveCustomerName } from "@/app/actions/customer";
import { startReservationCheckout } from "@/app/actions/payments";
import { QuadPreviewComplete } from "@/components/quads/quad-preview-complete";
import { quadPreviewPlan, type QuadPreviewPick } from "@/components/quads/quad-preview-plan";
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
import type { DayIcon } from "@/components/booking/day-picker";
import type { AccountValues } from "./account-step";
import { ActivitiesStep } from "./activities-step";
import { ACTIVITY_ICON } from "./activity-icons";
import { ActivityAbout } from "./activity-about";
import { ActivityTabs } from "./activity-tabs";
import { MobilePlanDock } from "./mobile-plan-dock";
import { PlanPanel } from "./plan-panel";
import { planQuantities } from "./plan-quantities";
import { ReservationDone } from "./reservation-done";
import { ReservationAccountDialog } from "./reservation-account-dialog";
import { requestsFor, submitReservation, type Outcome } from "./submit-reservation";
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
  payments,
  initialCustomer,
}: {
  header: ReactNode;
  data: ReservationData;
  initialTab?: ActivityId;
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
  const offer = offered(data);
  const tabs = ACTIVITY_TAB_ORDER.filter((id) => offer[id]);
  const [tab, setTab] = useState<ActivityId>(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
  const [date, setDate] = useState(days[0]);
  const [draftNights, setDraftNights] = useState(1);
  const [stayDatePhase, setStayDatePhase] = useState<StayDatePhase>("idle");
  const [people, setPeople] = useState(1);
  const [picks, setPicks] = useState<Picks>({});
  const [previewQuad, setPreviewQuad] = useState<QuadPreviewPick | null>(null);
  const [previewComplete, setPreviewComplete] = useState(false);
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
  const stayEnd = stayDatePhase === "complete" ? stayDates[stayNights] : null;
  const incompleteStay = picks.nakvyne !== undefined && !stayEnd;
  const showStayDates = stayDatePhase !== "idle" && (picks.nakvyne !== undefined || (step === 0 && tab === "nakvyne"));
  const when: When = { day, people };
  const plans = planAll(incompleteStay ? { ...picks, nakvyne: undefined } : picks, data, when);
  const quadTour = quadPreviewPlan(data.quads, when, previewQuad, planHours(plans.pirtis));
  const lines = describePlans(plans, when);
  if (quadTour) lines.unshift(quadTour.line);
  if (incompleteStay) {
    lines.push({ id: "nakvyne", title: ACTIVITY_TITLE.nakvyne, detail: "Pasirink išvykimo datą.", schedule: `Atvykimas ${longDateLabel(date)}`, price: 0 });
  }
  const total = totalOf(lines);
  // A quad preview books nothing, so no code applies to it.
  const discount = previewQuad ? null : appliedDiscount;
  // Preview only: each request's database function prices the code again.
  const discountAmount = discount
    ? Math.round(lines.reduce((sum, line) => sum + (isDiscountService(line.id) ? discountFor(discount, line.id, line.price) : 0), 0) * 100) / 100
    : 0;
  const tracksPeople = Boolean(plans.pirtis && plans.pirtis.mode !== "private");
  const dateLabel = longDateLabel(date);
  const checkoutLabel = showStayDates && stayEnd ? longDateLabel(stayEnd) : null;
  const datesLabel = checkoutLabel ? `${dateLabel} iki ${checkoutLabel}` : dateLabel;
  const whenLabel = tracksPeople ? `${datesLabel}, ${people} žm.` : datesLabel;
  /** Sauna, quad and stay icons under each day, lit when something is still free. */
  const dayIcons = (d: Date): DayIcon[] => {
    const free = dayAvailability(data, dateKey(d), people, stayEnd ? stayNights : 1);
    return tabs.map((id) => ({
      Icon: ACTIVITY_ICON[id],
      label: `${ACTIVITY_TITLE[id]} ${free[id] ? "laisva" : "užimta"}`,
      on: free[id],
    }));
  };
  const inPlan = tabs.filter((id) => picks[id] !== undefined || (id === "keturraciai" && previewQuad !== null));
  const validPlan = previewQuad === null
    ? bookable(plans)
    : Boolean(quadTour?.ok && (chosen(plans).length === 0 || bookable(plans)));
  const selectionReady = !incompleteStay && validPlan;
  const ready = selectionReady && customer !== null;
  const busy = form.formState.isSubmitting || redirecting;

  function selectStayDate(next: Date) {
    if (busy) return;
    setStep(0);
    const key = dateKey(next);
    if (stayDatePhase !== "selectingEnd" || key <= day) {
      if (key !== day) setPreviewQuad(null);
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
    if (id === "keturraciai" && previewQuad) {
      if (busy) return;
      setPreviewQuad(null);
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
    if (id === "nakvyne") setDraftNights(stayNights);
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
  if (previewQuad && quadTour && quadTour.maxUnits > 0) {
    quantities.keturraciai = [{
      id: "tour",
      label: "Keturračių kiekis",
      value: previewQuad.units,
      max: quadTour.maxUnits,
      onChange: (units) => {
        if (busy) return;
        setStep(0);
        setPreviewQuad((current) => current ? { ...current, units } : current);
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
    if (previewQuad) {
      setPreviewComplete(true);
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
      const result = await submitReservation(plans, when, contact, outcome?.sent ?? {}, discount);
      // The code stopped holding (used up, expired) part-way: drop it so "Bandyti dar kartą" files the rest without it.
      if (DISCOUNT_HINTS.has(result.error?.code ?? "")) setDiscount(null);
      setOutcome(result);
      return;
    }
    // Pay at submit: the server files every request and opens Checkout, or files nothing.
    form.clearErrors("root");
    const result = await startReservationCheckout({ contact: { customerName, discountCode: discount?.code }, requests: requestsFor(plans, when) });
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

  if (previewComplete) {
    return (
      <div className="space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        {header}
        <QuadPreviewComplete lines={lines} total={total} onReset={() => {
          setPreviewComplete(false);
          setStep(0);
        }} />
      </div>
    );
  }

  if (outcome) {
    return (
      <div className="space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        {header}
        <ReservationDone
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
  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => {
        event.preventDefault();
        next();
      }} noValidate className="px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="min-w-0 space-y-8 lg:col-span-2">
            <div ref={selectionHeader} tabIndex={-1} className="scroll-mt-32 outline-none">{header}</div>
            <ActivityTabs
              ids={tabs}
              active={tab}
              included={inPlan}
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
              onDate={(next) => {
                if (busy) return;
                if (dateKey(next) !== day) setPreviewQuad(null);
                setStep(0);
                setDate(next);
              }}
              icons={dayIcons}
              stay={tab === "nakvyne" ? { phase: stayDatePhase, end: stayEnd, lastEnd: stayDates[MAX_STAY_NIGHTS], onSelect: selectStayDate } : undefined}
            />
            <ActivitiesStep
              data={data}
              when={when}
              tab={tab}
              picks={picks}
              plans={plans}
              stayNights={stayEnd ? stayNights : null}
              previewQuad={previewQuad}
              quadPreviewHours={quadTour?.hours ?? []}
              onQuadPreview={(next) => {
                if (busy) return;
                setStep(0);
                setPreviewQuad(next);
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
          <PlanPanel activity={tab} continueAction={continueAction} secondaryAction={secondaryAction} {...planDetails} />
        </div>
      </form>
      <MobilePlanDock activity={tab} whenLabel={whenLabel} continueAction={continueAction} secondaryAction={secondaryAction} {...planDetails} />
      <ReservationAccountDialog
        open={step === LAST}
        onClose={() => { if (!busy) setStep(0); }}
        onReturnToPlan={() => selectionHeader.current?.focus({ preventScroll: true })}
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
        preview={previewQuad !== null}
        ready={ready}
        busy={busy}
        redirecting={redirecting}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
}
