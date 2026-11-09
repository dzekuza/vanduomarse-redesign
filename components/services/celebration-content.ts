import type { ServicePageCopy } from "./service-content";

export const CELEBRATION_LINKS = {
  vestuves: "Vestuvės",
  "imoniu-renginiai": "Įmonių renginiai",
  gimtadieniai: "Gimtadieniai",
} as const;

export const CELEBRATION_PAGES = {
  sventes: {
    service: "party",
    label: "Šventės Marse",
    title: "Šventės ir renginiai prie vandens",
    summary: "Vieta vestuvėms, gimtadieniams ir įmonių šventėms Kauno rajone. Erdvę, maistą, pramogas ir nakvynę suplanuok vienoje vietoje.",
    description: "Vanduo Marse gali rinktis kupolą, restoraną, terasą arba didesnę parko erdvę. Pasiūlymą parengsime pagal renginio pobūdį, datą ir svečių skaičių.",
    facts: [{ label: "Erdvės", value: "Kupolas, restoranas, terasa ir parko teritorija." }],
    questions: [{ title: "Kaip sužinoti, ar mano data laisva?", body: "Atsiųsk užklausą su data, svečių skaičiumi ir norima erdve. Komanda patikrins užimtumą." }],
  },
  vestuves: {
    service: "party",
    label: "Vestuvės",
    title: "Vestuvės prie vandens Kauno rajone",
    summary: "Vestuvių vieta Žemaitkiemyje, netoli Kauno. Apžiūrėk kupolą ir kitas erdves, kuriose gali suplanuoti vakarienę, šventę ir nakvynę svečiams.",
    description: "Kupolas tinka šventei su muzika ir šokiais. Kamerinėms vestuvėms galima rinktis terasą arba restoraną. Dėl ceremonijos vietos parke ir plano lietui pasitark su komanda.",
    facts: [
      { label: "Ceremonija", value: "Vietą ir įrengimą deriname pagal šventės planą." },
      { label: "Vakarienė", value: "Meniu ir aptarnavimą deriname su restorano komanda." },
      { label: "Nakvynė svečiams", value: "Dviviečiai ir keturviečiai nameliai pagal užimtumą." },
    ],
    questions: [
      { title: "Ar vestuvių svečiai gali pasilikti nakvynei?", body: "Taip, svečiai gali užsisakyti namelius. Dėl didesnio kiekio parašyk iš anksto." },
      { title: "Ar galime suplanuoti ceremoniją parke?", body: "Aptark norimą ceremonijos vietą ir svečių skaičių. Komanda įvertins galimybes tavo datai." },
    ],
  },
  "imoniu-renginiai": {
    service: "party",
    label: "Įmonių renginiai",
    title: "Įmonių renginiai ir komandos išvykos prie Kauno",
    summary: "Vieta įmonės šventei, konferencijai ar komandos dienai. Derink erdvę, maitinimą ir veiklas Vanduo Marse parke.",
    description: "Dieną gali pradėti seminaru kupole, tęsti pietumis ir užbaigti komandos veikla. Vakariniam renginiui derink privačią erdvę, vakarienę ir nakvynę kolegoms.",
    facts: [
      { label: "Konferencijos", value: "Kupole galimas konferencinis išdėstymas." },
      { label: "Komandos veiklos", value: "Pirtis, keturračiai arba sezoniniai plaukimai." },
      { label: "Maitinimas", value: "Kavos pertrauka, pietūs arba vakarienė pagal renginio programą." },
    ],
    questions: [
      { title: "Ar galime sujungti seminarą ir pramogas?", body: "Taip. Užklausoje aprašyk dienos planą ir norimas veiklas, kad komanda galėtų patikrinti jų užimtumą." },
      { title: "Kaip gauti pasiūlymą įmonei?", body: "Skaičiuoklėje pasirink renginio tipą, datą ir svečių skaičių, tada atsiųsk užklausą." },
    ],
  },
  gimtadieniai: {
    service: "party",
    label: "Gimtadieniai",
    title: "Kur švęsti gimtadienį netoli Kauno",
    summary: "Gimtadienio šventė prie vandens su vakariene, pramogomis ar nakvyne. Rinkis erdvę pagal savo kompaniją.",
    description: "Mažesnei kompanijai tinka vakarienė restorane ar terasa. Didesnei šventei galima rinktis kupolą, o prieš vakarienę suplanuoti pirtį arba išvyką keturračiais.",
    facts: [
      { label: "Šventės erdvės", value: "Terasa, restoranas arba kupolas." },
      { label: "Veiklos", value: "Pirtis, keturračiai ir sezoninės vandenlentės." },
      { label: "Nakvynė", value: "Nameliai prie vandens pagal užimtumą." },
    ],
    questions: [
      { title: "Ar galima švęsti su nedidele kompanija?", body: "Taip. Nurodyk svečių skaičių, kad galėtume pasiūlyti tinkamą erdvę ir maitinimą." },
      { title: "Nuo ko priklauso gimtadienio kaina?", body: "Kainą lemia data, erdvė, svečių skaičius, maitinimas ir pasirinktos pramogos. Preliminarią kainą matysi skaičiuoklėje." },
    ],
  },
} satisfies Record<string, ServicePageCopy>;
