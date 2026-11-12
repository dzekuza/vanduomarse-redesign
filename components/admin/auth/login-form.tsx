"use client";

import { CodeLoginForm } from "@/components/admin/auth/code-login-form";
import { PasswordLoginForm } from "@/components/admin/auth/password-login-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Staff choose how to sign in: password, or a code sent to their e-mail. */
export function LoginForm() {
  return (
    <Tabs defaultValue="password" className="gap-4">
      <TabsList className="w-full">
        <TabsTrigger value="password" className="min-h-11">Slaptažodis</TabsTrigger>
        <TabsTrigger value="code" className="min-h-11">El. pašto kodas</TabsTrigger>
      </TabsList>
      <TabsContent value="password">
        <PasswordLoginForm />
      </TabsContent>
      <TabsContent value="code">
        <CodeLoginForm />
      </TabsContent>
    </Tabs>
  );
}
