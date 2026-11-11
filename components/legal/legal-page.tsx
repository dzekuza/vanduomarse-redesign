import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import type { LegalSectionCopy } from "./privacy-content";

interface LegalPageProps {
  crumb: string;
  title: [string] | [string, string];
  intro: string;
  sections: LegalSectionCopy[];
}

/** Text page (privacy policy and similar): booking-style header, then titled sections of paragraphs. */
export function LegalPage({ crumb, title, intro, sections }: LegalPageProps) {
  return (
    <BookingPage>
      <div className="theme-reservation px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <div className="max-w-3xl space-y-10">
          <BookingHeader crumb={crumb} title={title} intro={intro} />
          {sections.map(({ title: heading, paragraphs }) => (
            <section key={heading} className="space-y-3">
              <h2 className="text-sm font-bold">{heading}</h2>
              {paragraphs.map((text) => (
                <p key={text} className="text-xs leading-loose">
                  {text}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </BookingPage>
  );
}
