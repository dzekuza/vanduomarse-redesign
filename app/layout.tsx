import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

// Termina, the live vanduomarse.lt face (licensed): Bold for headings, Regular for
// body text, Medium/SemiBold for UI emphasis (admin card titles, row labels) that
// needs more weight than Regular without the full heft of Bold.
const termina = localFont({
  variable: "--font-termina",
  src: [
    { path: "./fonts/Termina-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Termina-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Termina-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/Termina-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Vanduo Marse - kabelinis vandenlenčių parkas", template: "%s | Vanduo Marse" },
  description:
    "Vanduo Marse: kabelinis vandenlenčių parkas prie ežero. Plaukimas, Marso akademija, Pirtis Marse, Miegas Marse ir Skoniai Marse.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" data-scroll-behavior="smooth" className={cn("h-full antialiased font-sans", termina.variable)}>
      <body className="theme-marse min-h-full flex flex-col bg-dust text-ink">
        {children}
      </body>
    </html>
  );
}
