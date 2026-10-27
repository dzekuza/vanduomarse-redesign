import { CONTACTS } from "@/lib/contacts";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="px-6 pb-28 pt-6 md:px-10 md:pb-24">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
      <Wordmark aria-hidden className="mt-16" />
      <p className="mt-6 text-xs uppercase">© {new Date().getFullYear()} Vanduo Marse. Ežero krantas, Lietuva.</p>
    </footer>
  );
}
