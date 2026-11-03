import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Centred card for the admin login and no-access screens. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/brand/vanduo-marse-badge.svg" alt="Vanduo Marse" width={85} height={110} className="mx-auto h-14 w-auto" />
          <CardTitle className="font-display text-heading">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
