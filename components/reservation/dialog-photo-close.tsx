import { XIcon } from "@phosphor-icons/react";
import { DialogClose } from "@/components/ui/dialog";

/** Square close button that sits on a photo at the top of a dialog (top-right). */
export function DialogPhotoClose() {
  return (
    <DialogClose
      aria-label="Uždaryti"
      className="absolute top-3 right-3 z-10 grid size-11 place-items-center bg-ink/60 text-dust transition-colors duration-150 ease-out-strong hover:bg-rust hover:text-ink"
    >
      <XIcon size={18} aria-hidden />
    </DialogClose>
  );
}
