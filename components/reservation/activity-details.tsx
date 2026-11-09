import { CABIN_SIZES, CAMPER_MAX_GUESTS, ROOM_TYPES } from "@/lib/cabin";
import { Cta } from "@/components/cta";
import { QuadInformation } from "@/components/quads/quad-information";
import type { ActivityId, ReservationData } from "@/lib/reservation";

/** Dialog introduction, using the same price catalogues as the activity controls. */
export function activityBlurb(id: ActivityId, data: ReservationData): string {
  if (id === "pirtis") return "Prisijunk prie pirties seanso arba rezervuok privačią pirtį savo grupei.";
  if (id === "nakvyne") return `Nameliai 2 ar 4 asmenims ir kemperių aikštelė su elektra. Nuo ${CABIN_SIZES[0].pricePerNight} € / naktį.`;
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
    return (
      <div className="space-y-6">
        <Section title="Nameliai">
          <ul className="space-y-3">
            {CABIN_SIZES.map((s) => (
              <Item key={s.id} title={`Namelis ${s.label}`} meta={`${s.pricePerNight} € / naktį`} />
            ))}
          </ul>
        </Section>
        <Section title="Kemperiams">
          <ul className="space-y-3">
            {ROOM_TYPES.filter((r) => r.id === "kemperis").map((r) => (
              <Item key={r.id} title={`${r.label}, ${r.note}`} text={`Telpa iki ${CAMPER_MAX_GUESTS} žmonių.`} meta={`${r.pricePerNight} € / naktį`} />
            ))}
          </ul>
        </Section>
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
