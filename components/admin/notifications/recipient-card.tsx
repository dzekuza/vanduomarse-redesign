"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { NotificationRecipient } from "@/lib/admin/types";
import { topicLabel } from "@/lib/notification-topics";

interface RecipientCardProps {
  recipient: NotificationRecipient;
  onActive: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** "+37061234567" → "+370 612 34567" for reading; other countries are shown as stored. */
export const formatRecipientPhone = (phone: string) => (/^\+370\d{8}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone);

/** One person: name, number, the topics they are texted about; on/off switch, edit and delete. */
export function RecipientCard({ recipient, onActive, onEdit, onDelete }: RecipientCardProps) {
  return (
    <Card className={recipient.active ? "" : "opacity-70"}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-item">
          <span className="min-w-0 wrap-anywhere">{recipient.name}</span>
          {recipient.active ? null : <Badge variant="secondary">Išjungta</Badge>}
        </CardTitle>
        <CardDescription className="tabular-nums">{formatRecipientPhone(recipient.phone)}</CardDescription>
        <CardAction className="flex items-center gap-1">
          <Switch checked={recipient.active} aria-label={`${recipient.name}: pranešimai įjungti`} onCheckedChange={onActive} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Veiksmai: ${recipient.name}`}>
                <DotsThreeIcon size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Redaguoti</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
                Ištrinti
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-1.5">
          {recipient.topics.map((t) => (
            <li key={t}>
              <Badge variant={t === "visi" ? "default" : "secondary"}>{topicLabel(t)}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
