import { useId, type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AdminSectionProps {
  title: string;
  description?: ReactNode;
  /** Primary action, right of the heading on wide screens, below it on phones. */
  action?: ReactNode;
  /** Keep the heading for screen readers only and drop the note (the content explains itself). */
  hideHeading?: boolean;
  /** Wrap the block in a card background; without it the block sits on the page background. */
  framed?: boolean;
  children: ReactNode;
}

/** A block of an admin page: heading, note, action, then its content; optionally framed in a card. */
export function AdminSection({ title, description, action, hideHeading, framed, children }: AdminSectionProps) {
  const id = useId();
  // A hidden heading with no action leaves nothing to show: keep the label for screen readers only.
  const bare = hideHeading && !action;
  const header = bare ? (
    <h2 id={id} className="sr-only">
      {title}
    </h2>
  ) : (
    <div className="flex flex-col gap-3 @xl:flex-row @xl:items-start @xl:justify-between">
      <div className="min-w-0 @xl:max-w-2xl">
        <h2 id={id} className={hideHeading ? "sr-only" : "font-heading text-item leading-snug font-bold"}>
          {title}
        </h2>
        {description && !hideHeading ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  if (framed) {
    return (
      <section aria-labelledby={id} className="@container min-w-0">
        <Card>
          {bare ? null : <CardHeader>{header}</CardHeader>}
          <CardContent className="space-y-4">
            {bare ? header : null}
            {children}
          </CardContent>
        </Card>
      </section>
    );
  }
  return (
    <section aria-labelledby={id} className="@container min-w-0 space-y-4">
      {header}
      {children}
    </section>
  );
}
