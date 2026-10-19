import { BrandLogo } from "./brand-logo";

const CONTACTS = [
  { name: "Vanduo Marse", email: "info@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Pirtis Marse", email: "pirtis@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Miegas Marse", email: "miegas@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Skoniai Marse", email: "restoranas@vanduomarse.lt", phone: "+370 630 01 390" },
  { name: "Marso Akademija", email: "info@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Boardsports Shop", email: "hello@boardsports.lt", phone: "+370 695 55555", href: "https://boards.lt" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-dust px-6 py-14 md:px-10">
      <BrandLogo className="h-24 w-auto" />
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACTS.map((c) => (
          <div key={c.name}>
            <p className="font-display text-lg font-bold">
              {c.href ? (
                <a href={c.href} target="_blank" rel="noreferrer" className="hover:text-rust">
                  {c.name}
                </a>
              ) : (
                c.name
              )}
            </p>
            <p className="mt-2 text-sm text-ink/70">{c.email}</p>
            <p className="text-sm text-ink/70">{c.phone}</p>
          </div>
        ))}
      </div>
      <p className="mt-14 text-xs text-ink/50">© {new Date().getFullYear()} Vanduo Marse. Ežero krantas, Lietuva.</p>
    </footer>
  );
}
