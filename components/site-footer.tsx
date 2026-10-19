import { CONTACTS } from "@/lib/contacts";
import { BrandLogo } from "./brand-logo";

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
