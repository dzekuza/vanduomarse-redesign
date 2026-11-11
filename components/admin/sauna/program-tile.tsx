import { DotsThreeIcon } from "@phosphor-icons/react";
import { PROGRAM_KIND_LABEL, programPriceLine, type SaunaProgram } from "@/lib/sauna-programs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface ProgramTileProps {
  program: SaunaProgram;
  /** Number of sessions of this program (shown for session programs). */
  sessions: number;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One sauna program as a card block: name and actions, price line, kind (and session count), and the on/off switch. */
export function ProgramTile({ program: p, sessions, onToggle, onEdit, onDelete }: ProgramTileProps) {
  return (
    <Card className={p.active ? undefined : "bg-muted/40"}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className={`text-item ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mt-2 -mr-2 size-11" aria-label={`Veiksmai: ${p.name}`}>
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="font-display text-sm font-medium">{programPriceLine(p)}</p>
          <p className="text-xs text-muted-foreground">
            {PROGRAM_KIND_LABEL[p.kind]}
            {p.kind === "session" ? ` · seansų: ${sessions}` : ""}
          </p>
        </div>
        <label className="flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-sm">
          {p.active ? "Rodoma" : "Paslėpta"}
          <Switch checked={p.active} aria-label={`Rodyti „${p.name}“ rezervacijoje`} onCheckedChange={onToggle} />
        </label>
      </CardContent>
    </Card>
  );
}
