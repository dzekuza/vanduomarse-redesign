import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hoursLabel, type Sauna } from "@/lib/sauna";
import type { SaunaMaster } from "@/lib/sauna-masters";

const euro = (n: number) => `${String(n).replace(".", ",")} €`;

/** Saunas that share one price sheet are shown as one table (the sheet is the key). */
function groupByRates(saunas: readonly Sauna[]): Sauna[][] {
  const groups = new Map<string, Sauna[]>();
  for (const sauna of saunas) {
    const { weekdayPrices, weekendPrices, includedGuests, extraGuestFee } = sauna.rates;
    const key = JSON.stringify([weekdayPrices, weekendPrices, includedGuests, extraGuestFee]);
    groups.set(key, [...(groups.get(key) ?? []), sauna]);
  }
  return [...groups.values()];
}

function SaunaRateTable({ saunas, masters }: { saunas: Sauna[]; masters: readonly SaunaMaster[] }) {
  const { rates } = saunas[0];
  const lengths = [...new Set([...Object.keys(rates.weekdayPrices), ...Object.keys(rates.weekendPrices)].map(Number))].sort((a, b) => a - b);
  const master = masters.length ? masters.reduce((cheapest, m) => (m.price < cheapest.price ? m : cheapest)) : null;
  const masterMin = masters.length ? Math.max(...masters.map((m) => m.minHours)) : 0;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">{saunas.map((s) => s.name).join(" · ")}</h3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Trukmė</TableHead>
            <TableHead scope="col">I–IV</TableHead>
            <TableHead scope="col">V–VII</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lengths.map((hours) => (
            <TableRow key={hours}>
              <TableHead scope="row" className="font-medium">{hoursLabel(hours)}</TableHead>
              <TableCell className="font-bold">{rates.weekdayPrices[hours] === undefined ? "–" : euro(rates.weekdayPrices[hours])}</TableCell>
              <TableCell className="font-bold">{rates.weekendPrices[hours] === undefined ? "–" : euro(rates.weekendPrices[hours])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-copy">Bazinė kaina galioja iki {rates.includedGuests} žmonių. Už kiekvieną papildomą svečią +{euro(rates.extraGuestFee)}.</p>
      {master ? <p className="text-xs text-copy">Pirtininkas +{euro(master.price)}. Su pirtininku mažiausia rezervacijos trukmė {masterMin} val.</p> : null}
    </div>
  );
}

/** "Kainos" of the private sauna hire: one table per distinct price sheet, straight from the saunas' rates. */
export function SaunaPriceTables({ saunas, masters }: { saunas: readonly Sauna[]; masters: readonly SaunaMaster[] }) {
  return (
    <div className="space-y-6">
      {groupByRates(saunas).map((group) => (
        <SaunaRateTable key={group.map((s) => s.id).join("+")} saunas={group} masters={masters} />
      ))}
    </div>
  );
}
