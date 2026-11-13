import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : ""}`.toUpperCase() || "?";
}

/** The customer's registration photo (a short-lived signed URL) or their initials. */
export function ProfileAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string | null; className?: string }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- private signed URL, expires hourly; not a Next-optimizable asset
    return <img src={photoUrl} alt="Mano nuotrauka" className={cn("size-16 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span aria-hidden className={cn("inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-dust", className)}>
      {initials(name)}
    </span>
  );
}
