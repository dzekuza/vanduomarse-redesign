import { Type, type FunctionDeclaration } from "@google/genai";
import { createBooking, setBookingStatus, toggleBlock } from "@/app/admin/actions/bookings";
import { searchAdmin } from "@/lib/admin/global-search";
import { hasPermission, type StaffAccess } from "@/lib/admin/permissions";
import { loadAdminData } from "@/lib/admin/repository";
import type { BookingStatus } from "@/lib/admin/types";
import { pickStayType } from "@/lib/cabin";
import { sessionPrice } from "@/lib/sauna";
import { createClient } from "@/lib/supabase/server";

export const AGENT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_admin_data",
    description: "Ieško klientų, rezervacijų, keturračių nuomos, renginių ir užklausų pagal tekstą (vardą, telefoną, el. paštą arba rezervacijos kodą, pvz. VM-...).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Paieškos frazė: kliento vardas, telefono numeris, el. paštas arba rezervacijos numeris.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_availability",
    description: "Tikrina pirties, namukų ar kemperių užimtumą konkrečiai datai.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        service: {
          type: Type.STRING,
          description: "Paslaugos tipas: 'pirtis', 'namukas' arba 'kemperis'.",
        },
        date: {
          type: Type.STRING,
          description: "Data YYYY-MM-DD formatu (pvz. 2026-06-20).",
        },
      },
      required: ["service", "date"],
    },
  },
  {
    name: "create_booking",
    description: "Sukuria naują pirties arba nakvynės rezervaciją darbuotojo vardu.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: {
          type: Type.STRING,
          description: "Rezervacijos tipas: 'pirtis', 'namelis' arba 'kemperis'.",
        },
        customerName: {
          type: Type.STRING,
          description: "Kliento vardas ir pavardė.",
        },
        customerPhone: {
          type: Type.STRING,
          description: "Kliento telefono numeris (pvz. +37060000000).",
        },
        customerEmail: {
          type: Type.STRING,
          description: "Kliento el. paštas (jei žinomas).",
        },
        date: {
          type: Type.STRING,
          description: "Rezervacijos data YYYY-MM-DD formatu.",
        },
        guests: {
          type: Type.NUMBER,
          description: "Svečių skaičius.",
        },
        saunaId: {
          type: Type.STRING,
          description: "Pirties ID (pvz. 'didele-pirtis', 'mazoji-pirtis'). Būtina, jei kind yra 'pirtis'.",
        },
        startHour: {
          type: Type.NUMBER,
          description: "Pirties pradžios valanda (0-23, pvz. 18). Būtina, jei kind yra 'pirtis'.",
        },
        hours: {
          type: Type.NUMBER,
          description: "Pirties trukmė valandomis (pvz. 3). Būtina, jei kind yra 'pirtis'.",
        },
        nights: {
          type: Type.NUMBER,
          description: "Nakvynių skaičius (pvz. 1). Būtina, jei kind yra 'namelis' arba 'kemperis'.",
        },
        note: {
          type: Type.STRING,
          description: "Papildoma pastaba prie rezervacijos.",
        },
      },
      required: ["kind", "customerName", "customerPhone", "date", "guests"],
    },
  },
  {
    name: "update_booking_status",
    description: "Pakeičia esamos rezervacijos statusą (pvz. patvirtinta, laukia, ivykdyta, atsaukta).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingId: {
          type: Type.STRING,
          description: "Rezervacijos unikalus ID.",
        },
        status: {
          type: Type.STRING,
          description: "Naujas statusas: 'patvirtinta', 'laukia', 'ivykdyta', 'atsaukta'.",
        },
      },
      required: ["bookingId", "status"],
    },
  },
  {
    name: "toggle_sauna_block",
    description: "Užblokuoja arba atblokuoja konkrečią pirties valandą priežiūrai ar privatiems reikalams.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        saunaId: {
          type: Type.STRING,
          description: "Pirties ID.",
        },
        date: {
          type: Type.STRING,
          description: "Data YYYY-MM-DD formatu.",
        },
        hour: {
          type: Type.NUMBER,
          description: "Valanda (0-23).",
        },
        reason: {
          type: Type.STRING,
          description: "Užblokavimo priežastis.",
        },
      },
      required: ["saunaId", "date", "hour", "reason"],
    },
  },
  {
    name: "get_daily_summary",
    description: "Pateikia dienos atvykimų, aktyvių rezervacijų ir užimtumo suvestinę.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "Data YYYY-MM-DD formatu (jei nenurodyta, naudojama šiandienos data).",
        },
      },
    },
  },
];

/** Tools that change data. The chat route never runs these on the model's say-so; staff approve each one in the panel. */
export const MUTATING_AGENT_TOOLS: ReadonlySet<string> = new Set(["create_booking", "update_booking_status", "toggle_sauna_block"]);

export interface ToolExecutionResult {
  ok: boolean;
  summary: string;
  data?: unknown;
  actionLinks?: Array<{ label: string; href: string }>;
}

export async function executeAgentTool(
  toolName: string,
  args: Record<string, unknown>,
  access: StaffAccess,
): Promise<ToolExecutionResult> {
  const supabase = await createClient();

  switch (toolName) {
    case "search_admin_data": {
      const query = String(args.query ?? "").trim();
      if (!query) {
        return { ok: false, summary: "Nenurodyta paieškos užklausa." };
      }
      const data = await loadAdminData(supabase, access);
      const hits = searchAdmin(data, query, 5);

      if (hits.length === 0) {
        return { ok: true, summary: `Pagal užklausą „${query}“ nieko nerasta.`, data: [] };
      }

      const formatted = hits.map((h) => ({
        kategorija: h.group,
        pavadinimas: h.title,
        aprasas: h.subtitle,
        nuoroda: h.target.kind === "link" ? h.target.href : `/admin/rezervacijos`,
      }));

      const actionLinks = hits.slice(0, 3).map((h) => ({
        label: `${h.title} (${h.group})`,
        href: h.target.kind === "link" ? h.target.href : `/admin/rezervacijos`,
      }));

      return {
        ok: true,
        summary: `Rasta rezultatų: ${hits.length}`,
        data: formatted,
        actionLinks,
      };
    }

    case "get_availability": {
      const service = String(args.service ?? "pirtis").toLowerCase();
      const date = String(args.date ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { ok: false, summary: "Netinkamas datos formatas. Naudokite YYYY-MM-DD." };
      }

      const data = await loadAdminData(supabase, access);

      if (service.includes("pirt")) {
        const saunas = data.saunas.filter((s) => s.active);
        const dayBookings = data.bookings.filter((b) => b.kind === "pirtis" && b.date === date && b.status !== "atsaukta");
        const dayBlocks = data.blocks.filter((bl) => bl.date === date);

        const availability = saunas.map((sauna) => {
          const booked = dayBookings
            .filter((b) => b.saunaId === sauna.id)
            .map((b) => `${b.startHour}:00 (${b.hours} val., ${b.customer.name})`);
          const blocked = dayBlocks.filter((bl) => bl.saunaId === sauna.id).map((bl) => `${bl.hour}:00 (${bl.reason})`);

          return {
            pirtis: sauna.name,
            rezervacijos: booked.length > 0 ? booked : "Nėra",
            blokavimai: blocked.length > 0 ? blocked : "Nėra",
          };
        });

        return {
          ok: true,
          summary: `Pirties užimtumas ${date}`,
          data: availability,
        };
      }

      if (service.includes("namuk") || service.includes("kemper")) {
        const kind = service.includes("kemper") ? "kemperis" : "namelis";
        const nightOf = (start: string, offset: number) => new Date(Date.parse(`${start}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
        // A stay occupies its unit on every night from check-in up to the night before it ends.
        const occupying = data.bookings.filter((b) => b.kind === kind && b.status !== "atsaukta" && b.date <= date && date < nightOf(b.date, b.nights ?? 1));
        const types = data.stayTypes.filter((st) => st.active && st.kind === kind);

        return {
          ok: true,
          summary: `${kind === "kemperis" ? "Kemperių vietų" : "Namelių"} užimtumas ${date}`,
          data: {
            tipai: types.map((st) => {
              const taken = occupying.filter((b) => b.stayTypeId === st.id).reduce((sum, b) => sum + (b.stayUnits ?? 1), 0);
              return { tipas: st.label, vietuIki: st.maxGuests, viso: st.units ?? "neribota", uzimta: taken, laisva: st.units === null ? "neribota" : Math.max(0, st.units - taken) };
            }),
            uzsakymai: occupying.map((b) => ({ svecias: b.customer.name, tipas: b.stayTypeId, sveciuSk: b.guests, atvykimas: b.date, naktys: b.nights, statusas: b.status })),
          },
        };
      }

      return {
        ok: true,
        summary: `Užimtumo informacija datai ${date}`,
        data: "Pasirinkite 'pirtis' arba 'namukas'.",
      };
    }

    case "create_booking": {
      if (!hasPermission(access, "rezervacijos")) {
        return { ok: false, summary: "Neturite teisių kurti rezervacijų (trūksta 'rezervacijos' teisės)." };
      }

      const kindRaw = String(args.kind ?? "pirtis").toLowerCase();
      const kind: "pirtis" | "namelis" | "kemperis" = kindRaw.includes("nam")
        ? "namelis"
        : kindRaw.includes("kemp")
          ? "kemperis"
          : "pirtis";

      const customerName = String(args.customerName ?? "").trim();
      const customerPhone = String(args.customerPhone ?? "").trim();
      const customerEmail = String(args.customerEmail ?? "").trim();
      const date = String(args.date ?? "").trim();
      const guests = Number(args.guests) || 2;
      const note = String(args.note ?? "").trim();

      const adminData = await loadAdminData(supabase, access);

      let saunaId: string | undefined = undefined;
      let startHour: number | undefined = undefined;
      let hours: number | undefined = undefined;
      let nights: number | undefined = undefined;
      // Priced from the live rates, the same way the admin form does it, never typed in by the model.
      let total = 0;

      if (kind === "pirtis") {
        const requestedSaunaId = String(args.saunaId ?? "").trim();
        const matchedSauna = adminData.saunas.find((s) => s.id === requestedSaunaId || s.name.toLowerCase().includes(requestedSaunaId.toLowerCase())) ?? adminData.saunas[0];
        if (!matchedSauna) return { ok: false, summary: "Nerasta tokia pirtis. Patikslinkite pirties pavadinimą." };
        saunaId = matchedSauna.id;
        startHour = Number(args.startHour);
        hours = Number(args.hours);
        if (args.startHour === undefined || args.hours === undefined || !Number.isInteger(startHour) || startHour < 0 || startHour > 23 || !Number.isInteger(hours) || hours < 1) {
          return { ok: false, summary: "Trūksta pirties pradžios valandos arba trukmės. Paklauskite darbuotojo, kada pradėti ir kiek valandų." };
        }
        total = sessionPrice(hours, guests, matchedSauna.rates, date);
      } else {
        nights = Number(args.nights) || 1;
        const stayType = pickStayType(adminData.stayTypes, kind === "namelis" ? "namelis" : "kemperis", guests);
        if (!stayType) return { ok: false, summary: "Nerasta tinkama nakvynės rūšis šiam svečių skaičiui." };
        total = stayType.pricePerNight * nights;
      }
      if (total <= 0) return { ok: false, summary: "Nepavyko apskaičiuoti kainos pagal kainoraštį, todėl rezervacija nesukurta. Sukurkite ją per „Nauja rezervacija“." };

      const input = {
        kind,
        saunaId,
        date,
        startHour,
        hours,
        nights,
        guests,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || "",
        },
        extras: {},
        total,
        status: "patvirtinta" as const,
        source: "telefonu" as const,
        note: note ? `[AI Agentas] ${note}` : "[AI Agentas]",
        payment: { method: "grynais" as const, paid: false },
        discountCode: "",
        discountAmount: 0,
      };

      const result = await createBooking(input);
      if ("error" in result) {
        return { ok: false, summary: `Nepavyko sukurti rezervacijos: ${result.error.message}` };
      }

      const ref = result.data.booking.reference;
      return {
        ok: true,
        summary: `Sėkmingai sukurta rezervacija #${ref} (${customerName}, ${date}, ${total} €)`,
        data: result.data.booking,
        actionLinks: [
          {
            label: `Peržiūrėti rezervaciją #${ref}`,
            href: `/admin/rezervacijos`,
          },
        ],
      };
    }

    case "update_booking_status": {
      if (!hasPermission(access, "rezervacijos")) {
        return { ok: false, summary: "Neturite teisių keisti rezervacijos būsenos." };
      }

      const bookingId = String(args.bookingId ?? "").trim();
      const statusRaw = String(args.status ?? "").toLowerCase() as BookingStatus;
      const validStatuses: BookingStatus[] = ["patvirtinta", "laukia", "ivykdyta", "atsaukta"];

      if (!validStatuses.includes(statusRaw)) {
        return { ok: false, summary: `Netinkamas statusas. Galimi: ${validStatuses.join(", ")}` };
      }

      const result = await setBookingStatus(bookingId, statusRaw);
      if ("error" in result) {
        return { ok: false, summary: `Klaida atnaujinant statusą: ${result.error.message}` };
      }

      return {
        ok: true,
        summary: `Rezervacijos #${bookingId} būsena pakeista į „${statusRaw}“.`,
      };
    }

    case "toggle_sauna_block": {
      if (!hasPermission(access, "uzimtumas") && !hasPermission(access, "rezervacijos")) {
        return { ok: false, summary: "Neturite teisių blokuoti pirties laikų." };
      }

      const saunaId = String(args.saunaId ?? "").trim();
      const date = String(args.date ?? "").trim();
      const hour = Number(args.hour);
      const reason = String(args.reason ?? "Priežiūros darbai").trim();

      const result = await toggleBlock(saunaId, date, hour, reason);
      if ("error" in result) {
        return { ok: false, summary: `Klaida blokuojant laiką: ${result.error.message}` };
      }

      return {
        ok: true,
        summary: `Pirties ${saunaId} laikas ${date} ${hour}:00 sėkmingai pakeistas (${reason}).`,
      };
    }

    case "get_daily_summary": {
      const today = new Date().toISOString().slice(0, 10);
      const targetDate = String(args.date ?? today).trim() || today;
      const data = await loadAdminData(supabase, access);

      const dayBookings = data.bookings.filter((b) => b.date === targetDate && b.status !== "atsaukta");
      const arrivals = dayBookings.filter((b) => b.status === "patvirtinta" || b.status === "laukia");
      const dayRentals = data.quadRentals.filter((r) => r.date === targetDate && r.status !== "atsaukta");

      return {
        ok: true,
        summary: `Dienos ${targetDate} suvestinė`,
        data: {
          data: targetDate,
          visoRezervaciju: dayBookings.length,
          atvykimai: arrivals.map((b) => ({
            numeris: b.reference,
            klientas: b.customer.name,
            tipas: b.kind,
            laikas: b.startHour !== null ? `${b.startHour}:00 (${b.hours}h)` : `${b.nights} naktys`,
            statusas: b.status,
          })),
          keturraciai: dayRentals.map((r) => ({
            numeris: r.reference,
            klientas: r.customer.name,
            laikas: `${r.startHour}:00 (${r.hours} val.)`,
            kiekis: `${r.units} vnt.`,
          })),
        },
      };
    }

    default:
      return { ok: false, summary: `Nežinomas įrankis: ${toolName}` };
  }
}
