import { guestsLabel, lowestStayPrice, stayTypesOf } from "@/lib/cabin";
import { Cta } from "@/components/cta";
import { QuadInformation } from "@/components/quads/quad-information";
import type { ActivityId, ReservationData } from "@/lib/reservation";

/** Dialog introduction, using the same price catalogues as the activity controls. */
export function activityBlurb(id: ActivityId, data: ReservationData): string {
  if (id === "pirtis") return "Prisijunk prie pirties seanso arba rezervuok privačią pirtį savo grupei.";
  if (id === "nakvyne") {
    const from = lowestStayPrice(data.cabin.stayTypes);
    return `Nameliai ir kemperių aikštelės Vanduo Marse parke.${from === null ? "" : ` Nuo ${from} € / naktį.`}`;
  }
  const routes = data.quads.tourRoutes;
  if (routes.length === 0) return "Keturračių turai su gidu ir nuoma valandomis.";
  const from = Math.min(...routes.map((route) => route.price));
  return `${routes.map((route) => route.name).join(", ")}. Nuo ${from} € už keturratį. Vienam ar dviem kaina ta pati.`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-micro uppercase text-copy">{title}</h3>
      {children}
    </section>
  );
}

function Item({ title, text, meta }: { title: string; text?: string; meta?: string }) {
  return (
    <li className="flex items-start justify-between gap-4 border-t border-line pt-3 text-sm first:border-t-0 first:pt-0">
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        {text ? <span className="mt-1 block text-xs leading-relaxed text-copy">{text}</span> : null}
      </span>
      {meta ? <span className="shrink-0 text-xs font-bold">{meta}</span> : null}
    </li>
  );
}

/** Body of the "Sužinoti daugiau" dialog: everything the park has published about one activity. */
export function ActivityDetails({ id, data }: { id: ActivityId; data: ReservationData }) {
  if (id === "pirtis") {
    return (
      <div className="space-y-6">
        <Section title="Pirtys">
          <ul className="space-y-3">
            {data.sauna.saunas.map((s) => (
              <Item key={s.id} title={s.name} text={[s.description, s.features.join(" · ")].filter(Boolean).join(" ")} />
            ))}
          </ul>
        </Section>
        {data.sauna.programs.length > 0 ? (
          <Section title="Programos">
            <ul className="space-y-3">
              {data.sauna.programs.map((p) => (
                <Item key={p.id} title={p.name} text={p.description} meta={`${p.durationMinutes} min.`} />
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    );
  }

  if (id === "nakvyne") {
    const cabins = stayTypesOf(data.cabin.stayTypes, "namelis");
    const campers = stayTypesOf(data.cabin.stayTypes, "kemperis");
    return (
      <div className="space-y-6">
        {cabins.length ? (
          <Section title="Nameliai">
            <ul className="space-y-3">
              {cabins.map((t) => (
                <Item key={t.id} title={t.label} text={t.note || undefined} meta={`${t.pricePerNight} € / naktį · ${guestsLabel(t.maxGuests)}`} />
              ))}
            </ul>
          </Section>
        ) : null}
        {campers.length ? (
          <Section title="Kemperiams">
            <ul className="space-y-3">
              {campers.map((t) => (
                <Item key={t.id} title={t.note ? `${t.label}, ${t.note}` : t.label} text={`Telpa ${guestsLabel(t.maxGuests)}.`} meta={`${t.pricePerNight} € / naktį`} />
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Cta tone="dark" small href="/keturraciu-nuoma">Visi turai ir rezervacija</Cta>
      <Section title="Turai">
        <ul className="space-y-3">
          {data.quads.tourRoutes.map((route) => (
            <Item key={route.id} title={`${route.name} turas`} text={`${route.kilometres} km · ${route.hours} val. ${route.description}`} meta={`${route.price} € / keturračiui`} />
          ))}
        </ul>
      </Section>
      <QuadInformation accessories={data.quads.tourAccessories} />
    </div>
  );
}
