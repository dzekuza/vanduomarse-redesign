"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../admin-store";
import { cn } from "@/lib/utils";

function initials(name: string, surname: string): string {
  return `${name[0] ?? ""}${surname[0] ?? ""}`.toUpperCase() || "?";
}

interface RiderAvatarProps {
  name: string;
  surname: string;
  avatarPath: string | null;
  className?: string;
}

/** The rider's photo (resolved to a short-lived signed URL, the bucket is private) or their initials. */
export function RiderAvatar({ name, surname, avatarPath, className }: RiderAvatarProps) {
  const { getRiderFileUrl } = useAdmin();
  const [resolved, setResolved] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!avatarPath) return;
    let cancelled = false;
    getRiderFileUrl("rider-photos", avatarPath).then((result) => {
      if (!cancelled && "data" in result) setResolved({ path: avatarPath, url: result.data.url });
    });
    return () => {
      cancelled = true;
    };
  }, [avatarPath, getRiderFileUrl]);

  const url = resolved?.path === avatarPath ? resolved.url : null;

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- private signed URL, expires hourly; not a Next-optimizable asset
    return <img src={url} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }

  return (
    <span aria-hidden className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground", className)}>
      {initials(name, surname)}
    </span>
  );
}
