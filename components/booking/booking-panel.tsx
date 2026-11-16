import type { ReactNode, Ref } from "react";
import type { ServicePhoto } from "@/components/landing/content";
import { ServiceGallery } from "@/components/landing/service-gallery";
import { cn } from "@/lib/utils";

/** Photo and summary card shared by public booking and pass checkout. */
export function BookingPanel({ title, label, photos, photoLabel, galleryKey, artwork, showOnMobile, children, ref }: {
  title: string;
  label?: string;
  photos: ServicePhoto[];
  photoLabel: string;
  galleryKey?: string;
  artwork?: ReactNode;
  showOnMobile?: boolean;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  return (
    <aside ref={ref} aria-label={label ?? title} className={cn("min-w-0 border border-line bg-foam lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:overflow-y-auto", !showOnMobile && "hidden")}>
      {artwork ?? <ServiceGallery key={galleryKey} photos={photos} variant="panel" label={photoLabel} />}
      <div className="space-y-6 p-5 sm:p-8">
        <h2 className="text-tile font-bold">{title}</h2>
        {children}
      </div>
    </aside>
  );
}
