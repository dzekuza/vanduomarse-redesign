import { formatEur } from "@/lib/admin/format";
import { sessionPrice, type SaunaRates } from "@/lib/sauna";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** What a guest pays per duration and group size with the given rates. */
export function PricePreview({ rates }: { rates: SaunaRates | null }) {
  const hours = rates ? Array.from({ length: rates.maxHours - rates.minHours + 1 }, (_, i) => rates.minHours + i) : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaip atrodys kaina</CardTitle>
        <CardDescription>
          {rates
            ? `Iki ${rates.smallGroupMax} asm. ir ${rates.smallGroupMax + 1}–${rates.maxParty} asm., be papildomų paslaugų.`
            : "Ištaisykite klaidas formoje, kad matytumėte kainas."}
        </CardDescription>
      </CardHeader>
      {rates ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trukmė</TableHead>
                <TableHead className="text-right">Iki {rates.smallGroupMax} asm.</TableHead>
                <TableHead className="text-right">Iki {rates.maxParty} asm.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.map((h) => (
                <TableRow key={h}>
                  <TableCell>
                    {h} val.
                    {h === rates.packageHours ? <span className="ml-2 text-xs text-rust">paketas</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatEur(sessionPrice(h, rates.smallGroupMax, rates))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEur(sessionPrice(h, rates.maxParty, rates))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
}
