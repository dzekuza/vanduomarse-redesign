import { ArrowUpRightIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import type { ServiceId } from "@/components/landing/content";

/** Shown as plain text: the reviews are summaries and have no page of their own to link to. */
const GOOGLE_REVIEWS = { label: "„Google Maps“" };

const BOOKING_REVIEWS = {
  label: "Booking.com",
  href: "https://www.booking.com/reviews/lt/hotel/miegas-marse.html",
};

interface VisitorReview {
  name: string;
  topic: string;
  summary: string;
  rating?: string;
  source: { label: string; href?: string };
}

const park: VisitorReview[] = [
  {
    name: "Greta K",
    topic: "Poilsis parke",
    summary: "Mėgsta čia sugrįžti pailsėti. Išskyrė vaikų žaidimų aikštelę, baseiną ir maistą.",
    rating: "5/5",
    source: GOOGLE_REVIEWS,
  },
  {
    name: "Johirul Y",
    topic: "Pramogų parkas",
    summary: "Parką įvertino kaip gerą vietą atsipalaiduoti prie Kauno ir išbandyti įvairias veiklas.",
    rating: "5/5",
    source: GOOGLE_REVIEWS,
  },
];

const wake: VisitorReview = {
  name: "O’lena",
  topic: "Vandenlentės",
  summary: "Patiko, kad komanda padeda pradedantiesiems mokytis savo tempu, o patyrusiems plaukikams trasoje yra daug figūrų.",
  rating: "5/5",
  source: GOOGLE_REVIEWS,
};

const stay: VisitorReview[] = [
  {
    name: "Lazauskas",
    topic: "Nakvynė",
    summary: "Viešnagę įvertino kaip atpalaiduojančią. Minėjo, kad kondicionieriaus ir šaldytuvo garsas šiek tiek trukdė miegoti.",
    rating: "9/10",
    source: BOOKING_REVIEWS,
  },
  {
    name: "Kriss",
    topic: "Nakvynė",
    summary: "Patiko modernus namelis, dušas ir privatumas. Svečiui pritrūko kelių patogumų, įskaitant virdulį ir papildomą antklodę.",
    rating: "8/10",
    source: BOOKING_REVIEWS,
  },
];

const food: VisitorReview = {
  name: "rrickasstley",
  topic: "Restoranas",
  summary: "Palankiai atsiliepė apie svetingą priėmimą, maistą ir parko patogumus.",
  source: GOOGLE_REVIEWS,
};

const BY_SERVICE: Partial<Record<ServiceId, VisitorReview[]>> = {
  cabins: [...stay, park[0]],
  food: [food, ...park],
  wake: [wake, ...park],
};

/** Curated summaries of public reviews. Each card links to its published source. */
export function ServiceReviews({ service }: { service: ServiceId }) {
  const reviews = BY_SERVICE[service] ?? [...park, wake];

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-copy">Atrinktos „Vanduo Marse“ lankytojų atsiliepimų santraukos.</p>
      <ul className="grid gap-3 xl:grid-cols-3">
        {reviews.map(({ name, topic, summary, rating, source }) => (
          <li key={name} className="flex min-w-0 flex-col gap-4 border border-line bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="text-micro uppercase text-copy">{topic}</p>
              {rating ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                  <StarIcon aria-hidden className="size-4" weight="fill" />
                  <span className="sr-only">Įvertinimas </span>{rating}
                </span>
              ) : null}
            </div>
            <p className="grow text-sm leading-loose">{summary}</p>
            <div className="border-t border-line pt-3">
              <p className="break-words text-xs font-bold">{name}</p>
              {source.href ? (
                <a href={source.href} className="inline-flex min-h-11 items-center gap-2 text-xs text-copy underline underline-offset-4 hover:text-ink">
                  {source.label}<ArrowUpRightIcon aria-hidden className="size-4 shrink-0" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
