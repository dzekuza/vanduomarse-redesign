import { DotsThreeIcon, FireIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { fromPrice, type Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SaunaRowProps {
  sauna: Sauna;
  onDelete: () => void;
}

/** One sauna as a list row: cover thumbnail, name and details (open the editor) and the actions menu. Visibility is set in the editor. */
export function SaunaRow({ sauna: s, onDelete }: SaunaRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Link href={`/admin/pirtis/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground">
          {s.photos[0] ? <Image src={s.photos[0].url} alt="" fill sizes="56px" className="object-cover" /> : <FireIcon size={22} />}
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-sm font-medium ${s.active ? "" : "text-muted-foreground"}`}>
            {s.name}
            {s.active ? null : " (paslėpta)"}
          </span>
          <span className="block text-xs text-muted-foreground">
            nuo {fromPrice(s.rates)} € · iki {s.rates.maxParty} žm. · {s.photos.length} nuotr.
          </span>
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={`Veiksmai: ${s.name}`}>
            <DotsThreeIcon size={20} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/pirtis/${s.id}`}>Redaguoti</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
            Ištrinti
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
