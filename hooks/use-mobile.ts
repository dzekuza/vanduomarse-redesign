import { useCallback, useSyncExternalStore } from "react";

/** md by default; the admin sidebar passes 1024 (lg) so tablets get the drawer. */
const MOBILE_BREAKPOINT = 768;

/** True below `breakpoint` px. Server render assumes desktop. */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
