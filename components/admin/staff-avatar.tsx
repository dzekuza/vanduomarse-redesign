import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

interface StaffAvatarProps {
  name: string;
  className?: string;
}

/** Square monogram in the brand coral, standing in for a staff photo. */
export function StaffAvatar({ name, className }: StaffAvatarProps) {
  return (
    <span aria-hidden className={cn("inline-flex size-9 shrink-0 items-center justify-center bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground", className)}>
      {initials(name)}
    </span>
  );
}
