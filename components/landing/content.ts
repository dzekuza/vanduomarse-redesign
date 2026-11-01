import { CONTACTS, MAIN_CONTACT } from "@/lib/contacts";

/** Copy and structure for the home page (Lithuanian, no i18n library yet). Prices are never written here; see AGENTS.md rule 5. */

export const SERVICE_IDS = ["sauna", "ciongo", "party", "cabins", "wake", "food"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface Service {
  id: ServiceId;
  /** Name used in the plan summary and the request email. */
  name: string;
  /** Short label on the plan chip. */
  choice: string;
  /** Decorative glyph on the plan chip. */
  glyph: string;
  label: string;
  /** Dialog heading; `\n` is a line break. */
  title: string;
  photo: string;
  alt: string;
  description: string;
  facts: string[];
  /** One line under the facts (what the price depends on), never a figure. */
  priceNote: string;
  /** Which `CONTACTS` entry to show when there is no online booking form. */
  contact: string;
  /** Extra action for activities without an online form (e.g. the price calculator). */
  cta?: { href: string; label: string };
}

/** Where the park is; shown in the hero strip, the landing section and the map link. */
export const PARK_ADDRESS = {
  street: "Sausinės g. 20",
  village: "Žemaitkiemio km.",
  area: "Kauno rajonas, Lietuva",
} as const;

const restaurant = CONTACTS.find((c) => c.name === "Skoniai Marse") ?? MAIN_CONTACT;

export const SERVICES: Record<ServiceId, Service> = {
  sauna: {
    id: "sauna",
    name: "Pirtis",
    choice: "Pirtis",
    glyph: "≈",
    label: "01 / SUSITINKAM GARUOSE",
    title: "IŠJUNK DIENĄ.\nĮJUNK GARĄ.",
    photo: "/landing/sauna.webp",
    alt: "Vanduo Marse pirties interjeras",
    description:
      "Pirtis prie vandens. Vakaras, kuriam nereikia skubėjimo — tik laiko sau ir savų žmonių. Rinkis bendrą seansą arba pasiteirauk apie privačią pirtį.",
    facts: [
      "Bendri seansai su pirtininko programa.",
      "Privatus laikas jūsų kompanijai — pagal užsakymą.",
      "Konkrečią programą, laisvus laikus ir kainą matai rezervuodamas.",
    ],
    priceNote: "Kaina — pagal pasirinktą formatą.",
    contact: "Pirtis Marse",
  },
  ciongo: {
    id: "ciongo",
    name: "Ciongo keturračiai",
    choice: "Keturračiai",
    glyph: "↗",
    label: "02 / VANDUO MARSE × CIONGO",
    title: "IŠSUKAM\nSU CIONGO.",
    photo: "/landing/ciongo.webp",
    alt: "Ciongo keturratis miško trasoje",
    description:
      "Žvyras, miškas ir visai kitas maršrutas. Važiuok su Ciongo, o po trasos pratęsk dieną Marse. Vienu keturračiu galima važiuoti dviese.",
    facts: [
      "Trasa apie 1,5–2 val. — pagal tempą ir įgūdžius.",
      "Vienu keturračiu važiuoja iki 2 žmonių.",
      "Pirtis, maistas ir nakvynė užsakomi bei apmokami atskirai.",
    ],
    priceNote: "Kaina — rezervuojant keturračius.",
    contact: "Vanduo Marse",
  },
  party: {
    id: "party",
    name: "Šventė / įmonės renginys",
    choice: "Šventė / verslas",
    glyph: "✳",
    label: "03 / JŪSŲ ŠVENTĖS ORBITA",
    title: "SAVI ŽMONĖS.\nJŪSŲ RITMAS.",
    photo: "/landing/dome.webp",
    alt: "Šventei paruošta Vanduo Marse erdvė",
    description:
      "Vestuvių diena, gimtadienis, kolegų susitikimas ar įmonės šventė. Erdvę, maistą, veiklas ir nakvynę sudėliojam vienoje vietoje.",
    facts: [
      "Kupolas, restoranas ar terasa prie vandens.",
      "Privačios šventės su galimybe muziką leisti iki ryto.",
      "Meniu, pramogos ir nakvynė suderinami pagal kompaniją.",
    ],
    priceNote: "Individualus pasiūlymas pagal jūsų progą.",
    contact: "Vanduo Marse",
    cta: { href: "/skaiciuokle", label: "Apskaičiuok šventės kainą" },
  },
  cabins: {
    id: "cabins",
    name: "Nakvynė namelyje",
    choice: "Nakvynė",
    glyph: "⌂",
    label: "04 / DAR NE NAMO",
    title: "PASILIK.\nRYTAS MARSE.",
    photo: "/landing/cabins.webp",
    alt: "Marso nameliai prie vandens",
    description:
      "Po veiksmo, po šventės ar tiesiog vietoj dar vieno vakaro mieste. Pasilik namelyje prie vandens — ryte niekur nereikės lėkti.",
    facts: [
      "Nameliai prie vandens.",
      "Tinka ir trumpai išvykai, ir šventės tęsiniui.",
      "Namelių užimtumą, apgyvendinimą ir kainą matai pagal datą.",
    ],
    priceNote: "Kaina ir laisvi nameliai — pagal datą.",
    contact: "Miegas Marse",
  },
  wake: {
    id: "wake",
    name: "Vandenlentės",
    choice: "Vandenlentės",
    glyph: "↝",
    label: "05 / ŠILTASIS SEZONAS",
    title: "DAR VIENĄ\nRATĄ.",
    photo: "/landing/wake.webp",
    alt: "Vandenlentininkas Marso parke",
    description:
      "Pirmas startas ant vandens ar triukas, kurį seniai norisi pagauti? Marso vandenlenčių parkas laukia šiltuoju sezonu.",
    facts: [
      "Vandenlenčių parkas pradedantiems ir pažengusiems.",
      "Veikla priklauso nuo sezono ir oro sąlygų.",
      "Dėl mokymų, inventoriaus ir laisvų laikų susisiek iš anksto.",
    ],
    priceNote: "Sezono kainos ir laikai tikslinami rezervuojant.",
    contact: "Marso Akademija",
  },
  food: {
    id: "food",
    name: "Maistas",
    choice: "Maistas",
    glyph: "◌",
    label: "06 / SKONIAI MARSE",
    title: "PO VEIKSMO —\nPRIE STALO.",
    photo: "/landing/food.webp",
    alt: "Marso virtuvės maistas ant stalo",
    description:
      "Skaniai pabaigti dieną ar ilgai švęsti prie vieno stalo. Maistą ir meniu derinam taip, kad jūsų planui nieko netrūktų.",
    facts: [
      "Restoranas ir maistas jūsų šventei.",
      "Meniu pagal jūsų progą ir kompaniją.",
      "Darbo laiką, vietas ir meniu pasitikrinkite prieš atvykdami.",
    ],
    priceNote: `Restoranas: ${restaurant.phone}`,
    contact: "Skoniai Marse",
  },
};

export type ActivityFilter = "all" | "action" | "rest" | "celebrate";

export const FILTERS: { id: ActivityFilter; label: string; count?: string }[] = [
  { id: "all", label: "Visas Marsas", count: "06" },
  { id: "action", label: "Reikia veiksmo" },
  { id: "rest", label: "Norisi ramiau" },
  { id: "celebrate", label: "Yra ką švęsti" },
];

export interface ActivityCard {
  id: ServiceId;
  categories: ActivityFilter[];
  alt: string;
  tag: string;
  num: string;
  title: string;
  note: [string, string];
  /** Rounded corner on the photo, from the design. */
  corner?: "cabins" | "party";
}

export const ACTIVITY_CARDS: ActivityCard[] = [
  { id: "sauna", categories: ["rest"], alt: "Marso pirtis su dideliais langais į vandenį", tag: "SUSITINKAM GARUOSE", num: "01 / ATSIKVĖPK", title: "PIRTIS MARSE.", note: ["Šiluma, kuriai", "verta rasti laiko."] },
  { id: "ciongo", categories: ["action"], alt: "Ciongo keturratis važiuoja miško trasa", tag: "VANDUO MARSE × CIONGO", num: "02 / IŠSITAŠKYK", title: "DAUGIAU GAZO.", note: ["Vienu keturračiu", "galima dviese."] },
  { id: "party", categories: ["celebrate"], alt: "Kupolas ir šventės erdvė prie vandens", tag: "TAVO PROGA. TAVO ŽMONĖS.", num: "03 / ŠVĘSK", title: "GARSO IKI RYTO.", note: ["Šventės", "be skubėjimo namo."], corner: "party" },
  { id: "cabins", categories: ["rest"], alt: "Juodi Marso nameliai prie pat vandens", tag: "NIEKUR NESKUBAM", num: "04 / PASILIK", title: "RYTAS MARSE.", note: ["Nameliai.", "Vanduo už lango."], corner: "cabins" },
  { id: "wake", categories: ["action"], alt: "Vandenlentės ir šuoliai Marso parke", tag: "ŠILTASIS SEZONAS", num: "05 / PAGAUK BANGĄ", title: "VANDUO VEŽA.", note: ["Pirmas kartas", "ar dar vienas ratas?"] },
  { id: "food", categories: ["rest", "celebrate"], alt: "Maistas ir užkandžiai susitikimui Marse", tag: "PRIE VIENO STALO", num: "06 / PARAGAUK", title: "SKONIAI MARSE.", note: ["Po veiksmo", "visada skaniau."] },
];

export const EVENT_OPTIONS = [
  { n: "01", title: "ERDVĖ", body: "Kupolas, restoranas ar terasa prie vandens. Išsirenkam jūsų kompanijai tinkamą vietą." },
  { n: "02", title: "MAISTAS", body: "Nuo bendro stalo iki šventinės vakarienės. Meniu ir serviravimą derinam pagal jūsų progą." },
  { n: "03", title: "PRAMOGOS", body: "Ciongo keturračiai, pirtis ar sezoninės vandens veiklos. Planas pagal jūsų žmones ir oro sąlygas." },
  { n: "04", title: "NAKVYNĖ", body: "Po šventės pasiliekat Marse. Namelių užimtumą ir nakvynės galimybes suderiname iš anksto." },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Ar į Marsą galima atvykti ne vasarą?",
    a: "Taip. Pirtį, šventes ir nakvynę planuojame ir ne vasaros sezonu. Keturračių važiavimas derinamas pagal trasos ir oro sąlygas, vandenlentės — sezono metu. Prieš atvykdami susisiekite dėl norimos veiklos.",
  },
  {
    q: "Ar vienu keturračiu galime važiuoti dviese?",
    a: "Taip, vienu Ciongo keturračiu gali važiuoti iki dviejų žmonių. Trasa trunka apie 1,5–2 val., priklausomai nuo tempo ir įgūdžių. Kainas matysi keturračių rezervacijoje. Važiavimo sąlygas patiksliname rezervuojant.",
  },
  {
    q: "Ar pirtis įskaičiuota į keturračių kainą?",
    a: "Ne. Pirtį, maistą, šventės erdvę ir nakvynę deriname bei skaičiuojame atskirai. Užklausoje pažymėkite norimas veiklas — paruošime bendrą pasiūlymą.",
  },
  {
    q: "Ar galime švęsti iki ryto?",
    a: "Taip, privačioms šventėms turime galimybę muziką leisti iki ryto. Erdvę, šventės eigą ir visas sąlygas suderiname iš anksto su jūsų renginio komanda.",
  },
  {
    q: "Kaip patvirtinama rezervacija?",
    a: "Pirmiausia atsiųskite norimą datą, žmonių skaičių ir veiklas. Mūsų komanda patikrins užimtumą, pateiks kainą ir susitars su jumis. Šiame puslapyje parengta užklausa pati savaime datos nerezervuoja.",
  },
] as const;

export const GALLERY_SLIDES = [
  { src: "/landing/aerial.webp", alt: "Vanduo Marse parkas iš drono: ežeras, sala, nameliai ir kupolas", left: "01 / MŪSŲ MAŽA PLANETA", right: "VANDUO MARSE" },
  { src: "/landing/wake-dusk.webp", alt: "Vandenlentininkas šuolyje vakaro šviesoje", left: "02 / DAR VIENAS RATAS", right: "VANDENLENTĖS" },
  { src: "/landing/sauna.webp", alt: "Pirtis prie vandens, mediniai suolai ir akmenų krosnelė", left: "03 / GRĮŽTAM Į ŠILUMĄ", right: "PIRTIS MARSE" },
  { src: "/landing/cabins.webp", alt: "Nameliai prie vandens ir lėtas rytas", left: "04 / NIEKUR NESKUBAM", right: "MIEGAS MARSE" },
] as const;

export interface ServicePhoto {
  src: string;
  alt: string;
}

/** Photos shown in an activity's drawer carousel; the first is the one on its card. Add more files to `public/landing/` and list them here. */
export const SERVICE_GALLERY: Record<ServiceId, ServicePhoto[]> = {
  sauna: [
    { src: "/landing/sauna.webp", alt: SERVICES.sauna.alt },
    { src: "/landing/aerial.webp", alt: "Parkas iš oro: pirtis prie ežero" },
  ],
  ciongo: [
    { src: "/landing/ciongo.webp", alt: SERVICES.ciongo.alt },
    { src: "/landing/aerial.webp", alt: "Parkas iš oro: trasos aplink ežerą" },
  ],
  party: [
    { src: "/landing/dome.webp", alt: SERVICES.party.alt },
    { src: "/landing/night.webp", alt: "Vakarėlio muzika ir šviesos Vanduo Marse" },
    { src: "/landing/food.webp", alt: "Maistas šventės stalui" },
  ],
  cabins: [
    { src: "/landing/cabins.webp", alt: SERVICES.cabins.alt },
    { src: "/landing/aerial.webp", alt: "Parkas iš oro: nameliai prie vandens" },
  ],
  wake: [
    { src: "/landing/wake.webp", alt: SERVICES.wake.alt },
    { src: "/landing/wake-dusk.webp", alt: "Vandenlentininkas šuolyje vakaro šviesoje" },
  ],
  food: [
    { src: "/landing/food.webp", alt: SERVICES.food.alt },
    { src: "/landing/dome.webp", alt: "Šventei padengta erdvė" },
  ],
};

/** Activities that open a live booking form in their dialog; the rest show contacts. */
export const BOOKABLE_IDS = ["sauna", "cabins", "ciongo"] as const;
export const isBookable = (id: ServiceId): id is (typeof BOOKABLE_IDS)[number] => (BOOKABLE_IDS as readonly string[]).includes(id);

/** On-page anchors in the header and the menu panel. */
export const LANDING_NAV = [
  { href: "#kryptys", label: "Ką veikiam?", panel: "KĄ VEIKIAM?" },
  { href: "#sventes", label: "Šventės ir verslas", panel: "ŠVENČIAM." },
  { href: "#vieta", label: "Kur nusileisti?", panel: "NUSILEIDŽIAM." },
  { href: "#klausimai", label: "Klausimai", panel: "KLAUSIAM." },
] as const;

/** Booking pages the redesign must keep reachable from the menu panel. */
export const BOOKING_LINKS = [
  { href: "/pirtis", label: "Pirtis Marse" },
  { href: "/miegas", label: "Miegas Marse" },
  { href: "/keturraciai", label: "Keturračiai" },
  { href: "/renginiai", label: "Renginiai" },
  { href: "/skaiciuokle", label: "Skaičiuoklė" },
  { href: "/kuponai", label: "Dovanų kuponai" },
] as const;

export const MAIN_CONTACT_EMAIL = MAIN_CONTACT.email;

export const INSTAGRAM_URL = "https://www.instagram.com/vanduo_marse/";
