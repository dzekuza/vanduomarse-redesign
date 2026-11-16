import type { Metadata } from "next";
import { RegistrationPageContent, type RegistrationParams } from "@/components/registration/registration-page-content";
import { WAKE_BLACK_FRIDAY_PATH } from "@/lib/wake-black-friday";

export const metadata: Metadata = {
  title: "Black Friday WAKE sezono abonementas | Vanduo Marse",
  alternates: { canonical: WAKE_BLACK_FRIDAY_PATH },
  robots: { index: false, follow: true },
};

export default async function WakeBlackFridayPage({ searchParams }: {
  searchParams: Promise<Pick<RegistrationParams, "kitas">>;
}) {
  return <RegistrationPageContent params={await searchParams} blackFriday />;
}
