"use client";

import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_TOPICS, type NotificationTopic } from "@/lib/notification-topics";

interface TopicFieldsProps {
  value: NotificationTopic[];
  onChange: (value: NotificationTopic[]) => void;
  error?: string;
}

const GROUPS = [
  { id: "bendri", title: "Bendri" },
  { id: "paslaugos", title: "Pagal paslaugą" },
] as const;

/** The topic switches of the recipient form. "Visi pranešimai" covers every other topic, so turning it on clears the rest and shows them as on. */
export function TopicFields({ value, onChange, error }: TopicFieldsProps) {
  const everything = value.includes("visi");
  const toggle = (id: NotificationTopic, on: boolean) => {
    if (id === "visi") return onChange(on ? ["visi"] : []);
    const rest = value.filter((t) => t !== "visi" && t !== id);
    onChange(on ? [...rest, id] : rest);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Apie ką pranešti</legend>
      {GROUPS.map((group) => (
        <div key={group.id}>
          {group.id === "bendri" ? null : <p className="pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.title}</p>}
          {NOTIFICATION_TOPICS.filter((t) => t.group === group.id).map((t) => {
            const checked = t.id === "visi" ? everything : everything || value.includes(t.id);
            return (
              <label key={t.id} className="flex min-h-11 cursor-pointer items-start gap-3 border-b py-2.5 last:border-b-0">
                <Switch className="mt-0.5" checked={checked} disabled={t.id !== "visi" && everything} onCheckedChange={(on) => toggle(t.id, on)} aria-label={t.label} />
                <span>
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      ))}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
}
