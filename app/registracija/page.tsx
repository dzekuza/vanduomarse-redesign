import type { Metadata } from "next";
import { RegistrationPageContent, type RegistrationParams } from "@/components/registration/registration-page-content";

export const metadata: Metadata = {
  title: "Registracija - Vanduo Marse",
  description: "Užsiregistruok internetu — kontaktai, nuotrauka ir taisyklių sutikimas — ir darbuotojas kasoje iškart priskirs tau apyrankę.",
  // A personal form with ?abonementas= variants: not for search results.
  alternates: { canonical: "/registracija" },
  robots: { index: false, follow: true },
};

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<RegistrationParams> }) {
  return <RegistrationPageContent params={await searchParams} />;
}
