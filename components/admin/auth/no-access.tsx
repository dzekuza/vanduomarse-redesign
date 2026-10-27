import { signOut } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./auth-card";

export type NoAccessReason = "not-staff" | "inactive" | "no-pages";

const DESCRIPTION: Record<NoAccessReason, (email: string) => string> = {
  "not-staff": (email) => `Paskyra ${email} neturi prieigos prie valdymo. Kreipkitės į administratorių.`,
  inactive: (email) => `Paskyra ${email} išjungta. Kreipkitės į administratorių.`,
  "no-pages": (email) => `Paskyrai ${email} dar nesuteikta prieiga prie jokio skyriaus. Kreipkitės į administratorių.`,
};

/** Signed in, but not allowed in: no staff row, switched off, or a role without pages. */
export function NoAccess({ email, reason = "not-staff" }: { email: string; reason?: NoAccessReason }) {
  return (
    <AuthCard title="Nėra prieigos" description={DESCRIPTION[reason](email)}>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="lg" className="min-h-11 w-full">
          Atsijungti
        </Button>
      </form>
    </AuthCard>
  );
}
