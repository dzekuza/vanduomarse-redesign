import type { Ref } from "react";

/** Top of every step: "01 / EYEBROW", a big title and one line of help. */
export function StepHeading({ ref, step, eyebrow, title, text }: { ref: Ref<HTMLHeadingElement>; step: number; eyebrow: string; title: string; text?: string }) {
  return (
    <header className="space-y-4">
      <p className="text-micro uppercase text-copy">
        {String(step).padStart(2, "0")} / {eyebrow}
      </p>
      <h2 ref={ref} tabIndex={-1} className="scroll-mt-32 text-tile font-bold outline-none">{title}</h2>
      {text ? <p className="text-sm text-copy md:text-base">{text}</p> : null}
    </header>
  );
}
