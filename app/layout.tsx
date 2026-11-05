import type { Metadata } from "next";
import { Big_Shoulders } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
  // No fallback metrics exist for this face; skip the "Failed to find font override values" warning.
  adjustFontFallback: false,
});

// Termina, the live vanduomarse.lt face (licensed): Bold for headings, Regular for text.
const termina = localFont({
  variable: "--font-termina",
  src: [
    { path: "./fonts/Termina-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Termina-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Vanduo Marse - kabelinis vandenlenčių parkas",
  description:
    "Vanduo Marse: kabelinis vandenlenčių parkas prie ežero. Plaukimas, Marso akademija, Pirtis Marse, Miegas Marse ir Skoniai Marse.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" data-scroll-behavior="smooth" className={cn("h-full antialiased font-sans", bigShoulders.variable, termina.variable)}>
      <body className="theme-marse min-h-full flex flex-col bg-dust text-ink">
        {children}
      </body>
    </html>
  );
}
