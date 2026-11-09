import type { ServiceId } from "@/components/landing/content";
import type { ActivityId } from "@/lib/reservation";
import { CELEBRATION_PAGES } from "./celebration-content";

export interface ServicePageCopy {
  service: ServiceId;
  label: string;
  title: string;
  summary: string;
  description: string;
  facts: { label: string; value: string }[];
  questions: { title: string; body: string }[];
  activity?: ActivityId;
  availabilityNote?: string;
}

export const SERVICE_PAGES = {
  pirtis: {
    service: "sauna",
    label: "Pirtis Marse",
    title: "Pirties nuoma ir seansai Kauno rajone",
    summary: "Suomiška sauna prie vandens. Rezervuok sauną savo kompanijai arba vietą pirties seanse.",
    description: "Suomiška sauna įsikūrusi Vanduo Marse parke, Žemaitkiemyje, maždaug 20 minučių nuo Kauno centro. Sauną gali išsinuomoti visai kompanijai su pirtininko programa arba be jos. Artimiausius pirties seansus rasi tvarkaraštyje.",
    facts: [
      { label: "Malkinė pirtis", value: "Dar įrengiama. Talpins iki 25 žmonių." },
      { label: "Suomiška sauna", value: "Iki 20 žmonių. Pro panoraminius langus matyti vanduo." },
      { label: "Priešpirtis", value: "Iki 30 žmonių. Dėl naudojimo susitark rezervuodamas." },
      { label: "Rezervacijos formatai", value: "Pirties seansai ir privati nuoma su pirtininku arba be jo." },
    ],
    questions: [
      { title: "Ar galima rezervuoti visą pirtį?", body: "Taip. Pasirink suomišką sauną, nuomą su pirtininku arba be jo, tada datą ir laisvą pradžios laiką." },
      { title: "Kaip užsiregistruoti į pirties seansą?", body: "Atidaryk seansą iš tvarkaraščio arba pasirink „Pirties seansas“, datą ir laiką rezervacijos skiltyje. Nurodyk vietų skaičių ir spausk „Rezervuoti“." },
      { title: "Kiek žmonių telpa pirtyse?", body: "Suomiškoje saunoje telpa iki 20 žmonių, priešpirtyje iki 30. Įrengiama malkinė pirtis talpins iki 25 žmonių." },
    ],
    activity: "pirtis",
  },
  "keturraciu-nuoma": {
    service: "ciongo",
    label: "Keturračiai",
    title: "Keturračių nuoma ir turai prie Kauno",
    summary: "Mini, Midi ir Maxi išvykos keturračiais. Apžiūrėk „Vanduo Marse“ ir „Ciongo“ turų pasiūlymą bei palygink trasas.",
    description: "Trumpesnė trasa tinka pirmai pažinčiai su keturračiu, ilgesnė skirta tiems, kurie nori daugiau laiko miške ir bekelėje. Vienu keturračiu gali važiuoti vairuotojas su keleiviu. Dėl išvykos iš Vanduo Marse susitark su komanda.",
    facts: [
      { label: "Trasos", value: "Mini, Midi ir Maxi" },
      { label: "Grupė", value: "Turui reikia bent 3 keturračių." },
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
    title: "Nameliai prie vandens Kauno rajone",
    summary: "Dviviečiai ir keturviečiai nameliai Vanduo Marse parke. Pasitikrink laisvas datas nakvynei po šventės ar savaitgaliui prie vandens.",
    description: "Rinkis dvivietį ar keturvietį namelį. Jei atvyksti savo kemperiu, yra vietų su elektros įvadu. Nakvynę galima užsakyti kelioms naktims.",
    facts: [{ label: "Nameliai", value: "2 arba 4 asmenims" }, { label: "Kemperiai", value: "Aikštelė su elektros įvadu" }],
    questions: [
      { title: "Kaip patikrinti namelių užimtumą?", body: "Pasirink atvykimo ir išvykimo datas. Prie kiekvieno tipo pamatysi, kiek vienetų liko laisvų visai viešnagei." },
      { title: "Ar galima užsakyti kelis namelius?", body: "Taip. Pasirink norimo tipo namelių kiekį pagal užimtumą. Dėl skirtingų tipų vienai grupei susisiek su Miegas Marse komanda." },
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
    title: "Vandenlenčių parkas prie Kauno",
    summary: "Kabelinis vandenlenčių parkas Žemaitkiemyje. Išbandyk pirmą plaukimą arba tobulink triukus ant vandens.",
    description: "Vanduo Marse vandenlenčių parkas veikia šiltuoju sezonu. Jei plauksi pirmą kartą, su Marso Akademija iš anksto aptark pradedančiųjų laikus, treniruotę ir įrangą.",
    facts: [
      { label: "Trasa", value: "Kabelinė vandenlenčių trasa su figūromis." },
      { label: "Sezonas", value: "Plaukimų laikai priklauso nuo sezono ir oro." },
      { label: "Pirmas plaukimas", value: "Dėl treniruotės ir įrangos susisiek su Marso Akademija." },
    ],
    questions: [
      { title: "Ar galiu plaukti, jeigu dar nesu bandęs?", body: "Taip. Dėl pirmos treniruotės ir tinkamos įrangos susisiek su Marso Akademija." },
      { title: "Kada veikia vandenlenčių trasa?", body: "Trasa veikia šiltuoju sezonu. Tikslius plaukimų laikus prieš atvykdamas pasitikrink su komanda." },
    ],
    availabilityNote: "Dėl individualių plaukimų ir treniruočių laikų kreipkis į Marso Akademiją.",
  },
  ...CELEBRATION_PAGES,
} satisfies Record<string, ServicePageCopy>;

export type ServiceSlug = keyof typeof SERVICE_PAGES;

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return Object.hasOwn(SERVICE_PAGES, slug);
}
