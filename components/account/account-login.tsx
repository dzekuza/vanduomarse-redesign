"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/reservation/login-form";

/** Signed-out view of the account page: the same code sign-in as checkout, then the page reloads signed in. */
export function AccountLogin() {
  const router = useRouter();
  return (
    <div className="max-w-xl space-y-6">
      <p className="text-copy">Prisijunk vienkartiniu kodu telefonu ar el. paštu, kad matytum savo rezervacijas. Jei paskyros dar nėra, ją sukursime. Slaptažodžio nereikia.</p>
      <LoginForm onCustomer={() => router.refresh()} />
    </div>
  );
}
