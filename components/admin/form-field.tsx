import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label, control and inline error for admin forms. */
export function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
