import { formatEur } from "@/lib/admin/format";
import { hoursLabel, sessionLengths, sessionPrice, type SaunaRates } from "@/lib/sauna";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** What a guest pays per session length with the given rates (a group within the included guests, no extras). */
export function PricePreview({ rates }: { rates: SaunaRates | null }) {
  const lengths = rates ? [...new Set([...sessionLengths(rates), ...sessionLengths(rates, "2026-11-13")])].sort((a, b) => a - b) : [];
  const cell = (hours: number, table: readonly number[], day: string) =>
    rates && table.includes(hours) ? formatEur(sessionPrice(hours, 1, rates, day)) : "–";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaip atrodys kaina</CardTitle>
        <CardDescription>
          {rates
            ? `Iki ${rates.includedGuests} asm. Kiekvienas svečias virš to – +${formatEur(rates.extraGuestFee)}, iki ${rates.maxParty} asm. (pilna grupė: +${formatEur((rates.maxParty - rates.includedGuests) * rates.extraGuestFee)}). Be priedų.`
            : "Ištaisykite klaidas formoje, kad matytumėte kainas."}
        </CardDescription>
      </CardHeader>
      {rates ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trukmė</TableHead>
                <TableHead className="text-right">Pr–Kt</TableHead>
                <TableHead className="text-right">Pn–Sk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lengths.map((h) => (
                <TableRow key={h}>
                  <TableCell>{hoursLabel(h)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell(h, sessionLengths(rates), "2026-11-11")}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell(h, sessionLengths(rates, "2026-11-13"), "2026-11-13")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
}
