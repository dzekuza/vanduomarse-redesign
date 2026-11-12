import type { ServiceId } from "@/components/landing/content";
import type { ActivityId } from "@/lib/reservation";
import { CELEBRATION_PAGES } from "./celebration-content";

export interface ServicePageCopy {
  service: ServiceId;
  label: string;
  title: string;
  summary: string;
  /** Meta description when summary + description would read badly or get cut. */
  metaDescription?: string;
  description: string;
  facts: { label: string; value: string }[];
  questions: { title: string; body: string }[];
  activity?: ActivityId;
  availabilityNote?: string;
  bookingIntro?: string;
}

export const SERVICE_PAGES = {
  pirtis: {
    service: "sauna",
    label: "Pirtis Marse",
    title: "Pirties nuoma prie Kauno: suomiška sauna",
    bookingIntro: "Rinkis privačią pirtį savo kompanijai arba vietą pirties seanse.",
    metaDescription: "Pirties nuoma prie Kauno: suomiška sauna prie ežero Žemaitkiemyje, 20 min. nuo miesto. Rezervuok pirtį kompanijai su pirtininku arba be jo.",
    summary: "Suomiška sauna prie ežero ir pirties seansai. Rezervuok privačią pirtį kompanijai arba vietą pirties seanse.",
    description: "Suomiška sauna įsikūrusi Vanduo Marse parke, Žemaitkiemyje, maždaug 20 minučių nuo Kauno centro. Pirtį Kaune ir Kauno rajone galima išsinuomoti visai kompanijai su pirtininko programa arba be jos. Artimiausius pirties seansus rasite kalendoriuje.",
    facts: [
      { label: "Priešpirtis", value: "Dėl naudojimo susitark rezervuodamas." },
      { label: "Privatus renginys pirtyje?", value: "Nuo gongų terapijos ir jogos pirtyje iki moterų ritualų. Turite idėją? Susisiekite, o mes padėsime ją įgyvendinti." },
    ],
    questions: [
      { title: "Ar galima rezervuoti visą pirtį?", body: "Taip. Pasirink suomišką sauną, nuomą su pirtininku arba be jo, tada datą ir laisvą pradžios laiką." },
      { title: "Kaip užsiregistruoti į pirties seansą?", body: "Atidaryk seansą iš tvarkaraščio arba pasirink „Pirties seansas“, datą ir laiką rezervacijos skiltyje. Nurodyk vietų skaičių ir spausk „Rezervuoti“." },
      { title: "Kiek žmonių telpa pirtyse?", body: "Talpą matysi prie kiekvienos pirties rezervacijos skiltyje. Dėl priešpirčio susisiek su komanda." },
      { title: "Kiek kainuoja pirties nuoma?", body: "Kaina priklauso nuo trukmės (2, 3, 4 val. arba visa diena) ir savaitės dienos. Kainų lentelę rasi šiame puslapyje, o galutinę kainą pamatysi rezervacijoje." },
      { title: "Ar galima išsinuomoti pirtį visai dienai?", body: "Taip. Pasirink „Visa diena“ ir laisvą pradžios laiką: seansas trunka nuo jo iki uždarymo, kaina ta pati." },
      { title: "Ar galima pirtis su pirtininku?", body: "Taip. Rezervuodamas gali pridėti pirtininką: garus, vanojimą ir ritualą. Su pirtininku seansas trunka bent 3 val." },
    ],
    activity: "pirtis",
  },
  "keturraciu-nuoma": {
    service: "ciongo",
    label: "Keturračiai",
    title: "Keturračių nuoma ir turai prie Kauno",
    bookingIntro: "Susidėliok turo planą. Rezervaciją patvirtins komanda.",
    metaDescription: "Keturračių nuoma prie Kauno: turai su gidu miške ir bekelėje, „Vanduo Marse“ ir „Ciongo“ trasos. Pasirink trasą, datą ir rezervuok.",
    summary: "Išvykos keturračiais su gidu. Apžiūrėk „Vanduo Marse“ ir „Ciongo“ turų pasiūlymą bei palygink trasas.",
    description: "Trumpesnė trasa tinka pirmai pažinčiai su keturračiu, ilgesnė skirta tiems, kurie nori daugiau laiko miške ir bekelėje. Vienu keturračiu gali važiuoti vairuotojas su keleiviu. Dėl išvykos iš Vanduo Marse susitark su komanda.",
    facts: [
      { label: "Apranga", value: "Rinkis judėti patogią aprangą pagal oro sąlygas." },
      { label: "Partneris", value: "Ciongo" },
    ],
    questions: [
      { title: "Ar vienu keturračiu gali važiuoti du žmonės?", body: "Taip. Kaina už keturratį vienam vairuotojui arba vairuotojui su keleiviu yra ta pati." },
      { title: "Kaip patvirtinti turo laiką ir išvykimo vietą?", body: "Susisiek su Vanduo Marse komanda ir nurodyk datą, trasą bei keturračių skaičių. Komanda patikslins užimtumą ir susitikimo vietą." },
    ],
    activity: "keturraciai",
  },
  nakvyne: {
    service: "cabins",
    label: "Nakvynė Marse",
    title: "Namelių nuoma prie ežero Kauno rajone",
    bookingIntro: "Pasirink nakvynės tipą ir datas. Kalendoriuje matysi, kiek namelių liko laisvų.",
    metaDescription: "Namelių nuoma prie ežero Kauno rajone: nakvynė Žemaitkiemyje, 20 min. nuo Kauno. Pasirink namelį ar vietą kemperiui ir pasitikrink laisvas datas.",
    summary: "Nameliai prie ežero Vanduo Marse parke. Pasitikrink laisvas datas nakvynei po šventės ar savaitgaliui gamtoje.",
    description: "Rinkis namelį pagal svečių skaičių. Jei atvyksti savo kemperiu, yra vietų su elektros įvadu. Nakvynę galima užsakyti kelioms naktims.",
    facts: [],
    questions: [
      { title: "Kaip patikrinti namelių užimtumą?", body: "Pasirink nakvynės tipą, atvykimo ir išvykimo datas. Galėsi pasirinkti tiek namelių, kiek jų laisva visai viešnagei." },
      { title: "Ar galima užsakyti kelis namelius?", body: "Taip. Pasirink norimo tipo namelių kiekį pagal užimtumą. Dėl skirtingų tipų vienai grupei susisiek su Miegas Marse komanda." },
      { title: "Kiek kainuoja nakvynė namelyje?", body: "Kaina priklauso nuo namelio tipo ir naktų skaičiaus. Ją pamatysi pasirinkęs tipą ir datas rezervacijos skiltyje." },
      { title: "Ar galima apsistoti su kemperiu?", body: "Taip. Yra vietų su elektros įvadu. Jas rasi tarp nakvynės tipų, kai pasirenki datas." },
    ],
    activity: "nakvyne",
  },
  restoranas: {
    service: "food",
    label: "Skoniai Marse",
    title: "Restoranas prie vandens Kauno rajone",
    summary: "„Skoniai Marse“ kviečia prie stalo Vanduo Marse parke. Rezervuok staliuką arba aptark maitinimą savo šventei.",
    description: "Į restoraną Žemaitkiemyje galima užsukti po veiklų parke arba atvykti pietų. Vestuvėms, gimtadieniams ir įmonių renginiams meniu derinamas su restorano komanda.",
    facts: [{ label: "Staliukai", value: "Rezervuojami telefonu." }, { label: "Maitinimas renginiams", value: "Meniu derinamas pagal progą ir svečių skaičių." }],
    questions: [
      { title: "Kur sužinoti, kada vyksta vėlyvieji pusryčiai?", body: "Dėl artimiausių vėlyvųjų pusryčių, meniu ir staliukų susisiek su restoranu. Darbo laiką pasitikrink prieš atvykdamas." },
      { title: "Ar galima užsakyti maistą privačiai šventei?", body: "Taip. Su restorano komanda aptark meniu, svečių skaičių ir šventės datą." },
    ],
    availabilityNote: "Dėl darbo laiko, meniu, vėlyvųjų pusryčių ir laisvų staliukų susisiek su restoranu.",
  },
  vandenlentes: {
    service: "wake",
    label: "Vandenlentės",
    title: "Wake parkas prie Kauno: vandenlenčių parkas",
    metaDescription: "Wake parkas Žemaitkiemyje, Kauno rajone: kabelinė vandenlenčių trasa su figūromis. Wakeboard pradedantiesiems ir pažengusiems. Aptark plaukimą.",
    summary: "Kabelinis wake parkas Žemaitkiemyje prie Kauno. Išbandyk pirmą plaukimą arba tobulink wakeboard triukus ant vandens.",
    description: "Vanduo Marse vandenlenčių parkas (wake parkas) veikia šiltuoju sezonu Žemaitkiemyje, Kauno rajone. Jei wakeboard plauksi pirmą kartą, su Marso Akademija iš anksto aptark pradedančiųjų laikus, treniruotę ir įrangą.",
    facts: [
      { label: "Trasa", value: "Kabelinė vandenlenčių trasa su figūromis." },
      { label: "Sezonas", value: "Plaukimų laikai priklauso nuo sezono ir oro." },
      { label: "Pirmas plaukimas", value: "Dėl treniruotės ir įrangos susisiek su Marso Akademija." },
    ],
    questions: [
      { title: "Ar galiu plaukti, jeigu dar nesu bandęs?", body: "Taip. Dėl pirmos treniruotės ir tinkamos įrangos susisiek su Marso Akademija." },
      { title: "Kada veikia vandenlenčių trasa?", body: "Trasa veikia šiltuoju sezonu. Tikslius plaukimų laikus prieš atvykdamas pasitikrink su komanda." },
      { title: "Kur yra wake parkas Kauno rajone?", body: "Vanduo Marse wake parkas yra Žemaitkiemyje, Kauno rajone, maždaug 20 minučių nuo Kauno centro." },
      { title: "Kas yra kabelinis wake parkas?", body: "Vandenlentininką traukia kabelių sistema virš vandens, todėl valties nereikia. Taip lengviau pradėti ir galima plaukti ratu su kitais." },
    ],
    availabilityNote: "Dėl individualių plaukimų ir treniruočių laikų kreipkis į Marso Akademiją.",
  },
  ...CELEBRATION_PAGES,
} satisfies Record<string, ServicePageCopy>;

export type ServiceSlug = keyof typeof SERVICE_PAGES;

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return Object.hasOwn(SERVICE_PAGES, slug);
}
