import { MAIN_CONTACT } from "@/lib/contacts";

export interface LegalSectionCopy {
  title: string;
  paragraphs: string[];
}

export const PRIVACY_INTRO =
  "Šioje politikoje paaiškiname, kokius asmens duomenis renkame, kai naudojiesi vanduomarse.lt, kam juos naudojame ir kokias teises turi.";

export const PRIVACY_SECTIONS: LegalSectionCopy[] = [
  {
    title: "Kas tvarko tavo duomenis",
    paragraphs: [
      `Duomenų valdytojas yra Vanduo Marse, UAB, Sausinės g. 20, Žemaitkiemio km., Kauno r. Klausimus dėl duomenų rašyk ${MAIN_CONTACT.email}.`,
    ],
  },
  {
    title: "Kokius duomenis renkame",
    paragraphs: [
      "Rezervacijos, užklausos ir kuponų užsakymo metu: vardas, el. pašto adresas, telefono numeris, pasirinkta paslauga, data, laikas ir žmonių skaičius.",
      "Paskyros metu: el. pašto adresas, telefono numeris (patvirtinamas SMS žinute) ir tavo rezervacijų istorija.",
      "Registracijos metu parke: vardas, kontaktai ir, jei pateiki, nuotrauka, reikalinga saugos instruktažui ir apyrankei.",
      "Techniniai duomenys: slapukai, reikalingi prisijungimui prie paskyros ir svetainės veikimui.",
    ],
  },
  {
    title: "Kam naudojame duomenis",
    paragraphs: [
      "Rezervacijoms ir užklausoms patvirtinti, apmokėjimams priimti, kuponams išsiųsti ir su tavimi susisiekti dėl užsakymo.",
      "Parko saugai ir tvarkai užtikrinti bei teisės aktų reikalavimams vykdyti. Atskiro sutikimo nereikalaujančius pranešimus apie užsakymą siunčiame remdamiesi sutarties vykdymu.",
    ],
  },
  {
    title: "Kam perduodame duomenis",
    paragraphs: [
      "Duomenis tvarko mūsų paslaugų teikėjai: duomenų bazės ir svetainės talpinimo, apmokėjimų, el. laiškų ir SMS žinučių paslaugų tiekėjai. Jie duomenis gauna tik tiek, kiek reikia paslaugai suteikti.",
      "Duomenų neparduodame. Valstybės institucijoms duomenis pateikiame tik tada, kai to reikalauja įstatymai.",
    ],
  },
  {
    title: "Kiek laiko saugome",
    paragraphs: [
      "Duomenis saugome tiek, kiek reikia tikslui, kuriam juos surinkome, ir tiek, kiek reikalauja buhalterijos ir kiti teisės aktai. Paskyrą gali ištrinti paprašęs el. paštu.",
    ],
  },
  {
    title: "Tavo teisės",
    paragraphs: [
      "Turi teisę žinoti, kokius tavo duomenis tvarkome, juos pataisyti, ištrinti, apriboti tvarkymą, perkelti ir nesutikti su tvarkymu. Parašyk mums ir atsakysime per 30 dienų.",
      "Jei manai, kad tavo duomenys tvarkomi netinkamai, gali pateikti skundą Valstybinei duomenų apsaugos inspekcijai (vdai.lrv.lt).",
    ],
  },
];
