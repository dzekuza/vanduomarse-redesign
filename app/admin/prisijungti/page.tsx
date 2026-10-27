import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth/auth-card";
import { LoginForm } from "@/components/admin/auth/login-form";

export const metadata: Metadata = { title: "Prisijungimas" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Valdymas" description="Prisijunkite darbuotojo paskyra.">
      <LoginForm />
    </AuthCard>
  );
}
