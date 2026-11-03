import { ArrowUpRightIcon, HouseIcon, WavesIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { ActivityId } from "@/lib/reservation";

/** One icon per activity, shared by the tab row and the availability marks under each day. */
export const ACTIVITY_ICON: Record<ActivityId, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  pirtis: WavesIcon,
  nakvyne: HouseIcon,
  keturraciai: ArrowUpRightIcon,
};
