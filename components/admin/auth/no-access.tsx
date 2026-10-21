import { signOut } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./auth-card";

/** Signed in, but not listed in public.staff. */
export function NoAccess({ email }: { email: string }) {
  return (
    <AuthCard title="Nėra prieigos" description={`Paskyra ${email} neturi prieigos prie valdymo. Kreipkitės į administratorių.`}>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="lg" className="min-h-11 w-full">
          Atsijungti
        </Button>
      </form>
    </AuthCard>
  );
}
