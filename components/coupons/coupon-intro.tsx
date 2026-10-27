import { COUPON_VALID_MONTHS } from "@/lib/coupons";

const STEPS = [
  { title: "Pasirink", text: "Euro vertės kuponą arba konkrečią patirtį." },
  { title: "Užsakyk", text: "Įrašyk savo ir gavėjo vardą, palinkėjimą. Susisieksime dėl apmokėjimo." },
  { title: "Gauk kodą", text: "Patvirtinę apmokėjimą atsiųsime kodą el. paštu." },
] as const;

export function CouponIntro() {
  return (
    <section className="px-6 pb-10 pt-6 md:px-10 md:pb-14 md:pt-10">
      <p className="mb-6 inline-block rounded-full border border-ink px-4 py-2 text-xs uppercase">Dovanų kuponai</p>
      <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight sm:text-5xl xl:text-6xl">Padovanok dieną ant vandens</h1>
      <p className="mt-6 max-w-xl text-ink/80">
        Kuponą galima išleisti plaukimui, pirčiai ar nakvynei. Galioja {COUPON_VALID_MONTHS} mėn. nuo apmokėjimo, likutį galima panaudoti
        dalimis.
      </p>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="font-wordmark text-5xl text-rust">{i + 1}</span>
            <div>
              <h2 className="font-display text-sm font-bold">{s.title}</h2>
              <p className="mt-1 text-sm text-ink/70">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
