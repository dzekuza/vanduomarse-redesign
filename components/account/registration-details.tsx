import type { MyRider } from "@/lib/account";

type Registration = NonNullable<MyRider["registration"]>;

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("lt-LT");

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-micro uppercase text-copy">{label}</dt>
      <dd className="mt-1 break-words font-bold">{value || "—"}</dd>
    </div>
  );
}

/** What the customer gave at /registracija: contacts, birth date, profile photo and when the park rules were signed. */
export function RegistrationDetails({ registration: r, registered }: { registration: Registration; registered: boolean }) {
  return (
    <section aria-label="Mano registracija" className="space-y-3">
      <h4 className="text-item font-bold">Mano registracija</h4>
      <div className="flex flex-col gap-4 sm:flex-row">
        {r.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private signed URL that expires hourly; not an optimizable asset
          <img src={r.photoUrl} alt="Mano nuotrauka" className="size-28 shrink-0 border border-line object-cover" />
        ) : null}
        <dl className="grid min-w-0 flex-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Detail label="El. paštas" value={r.email} />
          <Detail label="Telefonas" value={r.phone} />
          <Detail label="Papildomas telefonas" value={r.phone2} />
          <Detail label="Gimimo data" value={r.birthdate ? dayLabel(r.birthdate) : ""} />
          <Detail
            label="Parko taisyklės"
            value={r.signedAt ? `Pasirašytos ${dayLabel(r.signedAt)}${r.termsVersion ? ` (versija ${r.termsVersion})` : ""}` : "Nepasirašytos"}
          />
          <Detail label="Nuotrauka" value={r.photoUrl ? "Įkelta" : "Neįkelta"} />
        </dl>
      </div>
      {!registered ? <p className="text-sm text-copy">Registracija nebaigta: trūksta nuotraukos arba parašo.</p> : null}
    </section>
  );
}
