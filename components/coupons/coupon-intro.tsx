import { PageIntro } from "@/components/page-intro";
import { COUPON_VALID_MONTHS } from "@/lib/coupons";

const STEPS = [
  { title: "Pasirink", text: "Euro vertės kuponą arba konkrečią patirtį." },
  { title: "Užsakyk", text: "Įrašyk savo ir gavėjo vardą, palinkėjimą. Susisieksime dėl apmokėjimo." },
  { title: "Gauk kodą", text: "Patvirtinę apmokėjimą atsiųsime kodą el. paštu." },
] as const;

export function CouponIntro() {
  return (
    <PageIntro
      eyebrow="Dovanų kuponai"
      title={["Padovanok dieną", "ant vandens."]}
      intro={`Kuponą galima išleisti plaukimui, pirčiai ar nakvynei. Galioja ${COUPON_VALID_MONTHS} mėn. nuo apmokėjimo, likutį galima panaudoti dalimis.`}
    >
      <ol className="grid gap-6 border-t border-dust/30 pt-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="font-wordmark text-5xl text-rust">{i + 1}</span>
            <div>
              <h2 className="text-sm font-bold">{s.title}</h2>
              <p className="mt-1 text-xs leading-loose text-dust/80">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </PageIntro>
  );
}
