interface AdminPageProps {
  title: string;
  description?: string;
  /** Primary actions, right of the title on wide screens, below it on phones. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Common heading + body spacing for every admin screen. */
export function AdminPage({ title, description, actions, children }: AdminPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-heading font-bold md:text-total">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
