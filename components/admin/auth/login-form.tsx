"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "@/app/admin/actions";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.email("Įveskite el. paštą."),
  password: z.string().min(6, "Bent 6 simboliai."),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Email + password sign-in; a successful sign-in redirects to /admin on the server. */
export function LoginForm() {
  const { register, handleSubmit, setError, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await signIn(v);
    if (result && "error" in result) setError("password", { message: result.error.message });
  });

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <FormField id="email" label="El. paštas" error={err.email?.message}>
        <Input id="email" type="email" autoComplete="email" className="min-h-11" {...register("email")} />
      </FormField>
      <FormField id="password" label="Slaptažodis" error={err.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" className="min-h-11" {...register("password")} />
      </FormField>
      <Button type="submit" size="lg" className="min-h-11" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Jungiamasi…" : "Prisijungti"}
      </Button>
    </form>
  );
}
