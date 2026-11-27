import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Cta, textCtaClass } from "@/components/cta";
import { StarMark } from "@/components/star-mark";
import { MAIN_CONTACT, MAPS_URL, telHref } from "@/lib/contacts";
import { formatEuro } from "@/lib/coupons";
import { getOnlinePlans } from "@/lib/data/public";
import { isWakeBlackFridayDiscount, WAKE_BLACK_FRIDAY_DISCOUNT, WAKE_BLACK_FRIDAY_PATH, WAKE_SEASON_PASS_ID } from "@/lib/wake-black-friday";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { PARK_ADDRESS } from "./content";
import { HeroBookingLink } from "./hero-booking-link";
import { HeroOrbits } from "./hero-orbits";

export async function BlackFridayHero() {
  const [{ data: plans }, promo] = await Promise.all([getOnlinePlans(), checkDiscountCode(WAKE_BLACK_FRIDAY_DISCOUNT.code)]);
  const price = plans?.find(({ id }) => id === WAKE_SEASON_PASS_ID)?.price;
  // The owner sets the percentage in /admin/nuolaidos; the constant is only the fallback when the row cannot be read.
  const percent = "data" in promo && isWakeBlackFridayDiscount(promo.data) ? promo.data.value : WAKE_BLACK_FRIDAY_DISCOUNT.value;

  return (
    <section
      id="pradzia"
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col overflow-hidden bg-black pt-28 text-white lg:min-h-155 lg:flex-1 lg:pt-hero-kicker"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-hero opacity-10" />
      <HeroOrbits />

      <div className="relative flex flex-1 flex-col justify-center gap-5 pb-4 lg:gap-7 lg:pb-6">
        <div className="relative z-3 mx-gutter">
          <p className="text-micro md:text-xs">ŽEMĖ TA PATI. JAUSMAS KITAS.</p>
          <h1 id="hero-title" className="mt-5 w-fit text-campaign-hero md:mt-7">
            <span className="relative block w-fit">
              BLACK
              <StarMark className="absolute -top-1 -right-12 size-8 text-rust motion-safe:animate-spin-slow md:-right-19 md:size-13 lg:-right-24 lg:size-16" />
            </span>
            <span className="campaign-hero-outline block">FRIDAY</span>
          </h1>
        </div>

        <div className="relative order-last mx-gutter -mt-19 aspect-video min-h-60 md:aspect-auto md:h-88 lg:order-none lg:mt-0 lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:h-auto lg:w-2/3">
          <div className="absolute inset-0 overflow-hidden bg-black">
            <Image
              src="/landing/wake-black-friday-hero.webp"
              alt="Vandenlentininkė šuolyje virš vandens naktį"
              fill
              preload
              sizes="(min-width: 1024px) 67vw, 92vw"
              className="object-cover object-right"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black via-black/25 to-transparent lg:bg-linear-to-r lg:from-black lg:via-transparent lg:to-transparent" />
          </div>
        </div>

        <div className="relative z-3 mx-gutter lg:max-w-3/5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold md:text-item">
            <span>METINIS WAKE ABONEMENTAS</span>
            <span className="bg-rust px-2 py-1 leading-none text-black">
              −{percent} %{price !== undefined ? ` NUO ${formatEuro(price)}` : null}
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed md:text-sm">
            Įsigijus abonementą iki lapkričio 27 d., <strong className="max-lg:uppercase">nemokamai</strong> apsilankysi pirtyje.
          </p>
          <Cta href={WAKE_BLACK_FRIDAY_PATH} tone="coral" className="mt-5 text-black lg:mt-7">
            Pirkti abonementą
          </Cta>
        </div>
      </div>

      <div className="relative z-3 mx-gutter -mt-24 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 pt-2 pb-5 text-micro lg:mt-0 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="col-start-1 row-start-1 flex min-h-24 flex-col justify-center lg:contents">
          <address className="col-start-1 not-italic">
            <a href={MAPS_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center hover:underline">
              {PARK_ADDRESS.compact}
            </a>
          </address>
          <a href={telHref(MAIN_CONTACT.phone)} className="inline-flex min-h-11 items-center whitespace-nowrap hover:underline lg:col-start-2 lg:row-start-1 lg:justify-self-center">
            {MAIN_CONTACT.phone}
          </a>
        </div>
        <HeroBookingLink
          href={WAKE_BLACK_FRIDAY_PATH}
          lines={["BLACK FRIDAY", "ABONEMENTAS"]}
          restingClassName="relative col-start-2 row-start-1 justify-self-end max-lg:size-24 lg:absolute lg:right-0 lg:bottom-20"
          floatingClassName="fixed right-gutter bottom-20 max-lg:size-24 lg:right-6 lg:bottom-6"
          inkClassName="text-black"
        />
        <Link href="#kryptys" className={textCtaClass("col-span-2 row-start-2 justify-self-center gap-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:justify-self-end")}>
          Ką gali rezervuoti?
          <ArrowDownIcon aria-hidden className="size-6 transition-transform motion-safe:group-hover/cta:translate-y-1" />
        </Link>
      </div>
    </section>
  );
}
