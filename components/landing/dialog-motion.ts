/** Backdrop of the home page drawer: dark and blurred (vaul fades it; the Drawer switches transitions off under reduced motion). */
export const MODAL_OVERLAY = "bg-ink/80 backdrop-blur-sm";

/** Round close button of the home page drawer. */
export const MODAL_CLOSE =
  "absolute top-4.5 right-4.5 z-6 grid size-11 place-items-center rounded-full bg-ink text-dust transition-[scale] duration-150 ease-out-strong motion-safe:hover:scale-105 motion-safe:active:scale-95";

/** Floating drawer panel: right side with 16 px margins from `sm`, bottom sheet with 8 px margins on phones. Rounded, clips its content. */
export const DRAWER_PANEL =
  "gap-0 overflow-hidden rounded-tile border-0 bg-dust p-0 text-ink [--initial-transform:calc(100%+1rem)] data-[vaul-drawer-direction=bottom]:inset-x-2 data-[vaul-drawer-direction=bottom]:bottom-2 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-1rem)] data-[vaul-drawer-direction=right]:inset-y-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:w-[calc(100%-2rem)] data-[vaul-drawer-direction=right]:sm:max-w-2xl";
