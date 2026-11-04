const STEPS = [
  { title: "Pasirink", text: "Euro vertės kuponą arba konkrečią patirtį." },
  { title: "Užsakyk", text: "Įrašyk savo ir gavėjo vardą, palinkėjimą. Susisieksime dėl apmokėjimo." },
  { title: "Gauk kodą", text: "Patvirtinę apmokėjimą atsiųsime kodą el. paštu." },
] as const;

/** The three steps of buying a coupon, as a hairline-separated row. */
export function CouponSteps() {
  return (
    <ol className="grid gap-6 border-y border-line py-6 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex items-baseline gap-4">
          <span className="shrink-0 text-micro font-normal tracking-normal text-ink">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h2 className="text-sm font-bold">{s.title}</h2>
            <p className="mt-1 text-xs leading-loose text-copy">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
