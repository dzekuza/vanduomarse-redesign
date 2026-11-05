import photoManifest from "@/public/quads/ciongo/manifest.json";

/** Supplier reference content for the explicitly requested design preview. */
export interface QuadPreviewRoute {
  id: string;
  name: string;
  kilometres: number;
  hours: number;
  durationLabel: string;
  price: number;
  description: string;
  longDescription: string;
  photo: string;
  badge?: string;
}

export interface QuadAccessory {
  id: string;
  name: string;
  description: string;
  price: number;
}

export const QUAD_PREVIEW_ROUTES: QuadPreviewRoute[] = [
  {
    id: "mini", name: "Mini", kilometres: 20, hours: 1, durationLabel: "Iki 1 val.", price: 59,
    description: "Trumpas pabėgimas į bekelę. Pirmam kartui ar spontaniškam nuotykiui.",
    longDescription: "Trumpas turas norintiems per nedaug laiko išbandyti keturratį ir pajusti bekelę. Važiuojant laukia gamtos vaizdai, gaivus oras ir pirmosios nedidelės kliūtys. Tai galimybė susipažinti su keturračio valdymu, įveikti griovius ir aktyviai praleisti valandą. Maršrutą padeda įveikti kartu važiuojantis gidas, todėl galima ramiai mėgautis nauja patirtimi.",
    photo: "/quads/ciongo/mini-route.webp",
  },
  {
    id: "midi", name: "Midi", kilometres: 35, hours: 2, durationLabel: "Iki 2 val.", price: 79,
    description: "Daugiau miško, posūkių ir laiko įsivažiuoti.",
    longDescription: "Ilgesnis pasivažinėjimas norintiems daugiau laiko trasoje ir įvairesnių išbandymų. Maršrutas leidžia geriau perprasti keturračio valdymą, išbandyti greičio ruožus ir patirti daugiau bekelės. Kelionę lydi Lietuvos gamtos vaizdai. Turas suderina aktyvų važiavimą su galimybe įsivažiuoti ir per dvi valandas sukaupti daugiau naujų įspūdžių.",
    photo: "/quads/ciongo/midi-route.webp", badge: "Populiariausia",
  },
  {
    id: "maxi", name: "Maxi", kilometres: 50, hours: 3, durationLabel: "2-3 val.", price: 105,
    description: "Ilgesnė trasa tiems, kuriems vieno rato per mažai.",
    longDescription: "Ilgiausias iš šių trijų turų tiems, kurie nori daugiau iššūkių ir ilgesnio pasivažinėjimo. Maršrute dera tiesūs greičio ruožai, skirtingi posūkiai, daubos ir gamtos vaizdai. Daugiau laiko trasoje leidžia geriau pažinti keturračio galimybes, įsitraukti į važiavimą ir patirti įvairesnę bekelę. Kartu visos kelionės metu važiuoja gidas.",
    photo: "/quads/ciongo/maxi-route.webp",
  },
];

export const QUAD_PREVIEW_ACCESSORIES: QuadAccessory[] = [
  { id: "posalmis", name: "Pošalmis", description: "", price: 3 },
  { id: "vienkartinis-kostiumas", name: "Vienkartinis kostiumas nuo purvo", description: "", price: 5 },
  { id: "kostiumas-nuo-vejo", name: "Kostiumas nuo vėjo ir purvo", description: "", price: 10 },
];

export const QUAD_PREVIEW_GALLERY = photoManifest.photos
  .filter((photo) => photo.section === "gallery")
  .map(({ src, alt }) => ({ src, alt }));

export const QUAD_PREVIEW_SOURCE = photoManifest.sourcePage;
export const QUAD_PREVIEW_MIN_UNITS = 3;
