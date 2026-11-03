/** Top of every step: "01 / EYEBROW", a big title and one line of help. */
export function StepHeading({ step, eyebrow, title, text }: { step: number; eyebrow: string; title: string; text?: string }) {
  return (
    <header className="space-y-4">
      <p className="text-micro uppercase text-ink/70">
        {String(step).padStart(2, "0")} / {eyebrow}
      </p>
      <h2 className="text-tile font-bold">{title}</h2>
      {text ? <p className="text-sm text-lake-soft md:text-base">{text}</p> : null}
    </header>
  );
}
