import type { Metadata } from "next";
import { Archivo, Big_Shoulders, Work_Sans } from "next/font/google";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

// Stand-in for Termina (the live vanduomarse.lt face, licensed). Archivo's width
// axis gets close to Termina's wide stance; used site-wide by `theme-marse`.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Vanduo Marse - kabelinis vandenlenčių parkas",
  description:
    "Vanduo Marse: kabelinis vandenlenčių parkas prie ežero. Plaukimas, Marso akademija, Pirtis Marse, Miegas Marse ir Skoniai Marse.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className={`${bigShoulders.variable} ${workSans.variable} ${archivo.variable} h-full antialiased`}>
      <body className="theme-marse min-h-full flex flex-col bg-dust text-ink">{children}</body>
    </html>
  );
}
