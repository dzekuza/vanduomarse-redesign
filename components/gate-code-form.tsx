"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { enterSiteGate } from "@/app/actions/site-gate";
import { Cta } from "@/components/cta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GATE_PATH } from "@/lib/site-gate";
import { gateCodeSchema, type GateCodeValues } from "@/lib/site-gate-schema";

const COPY = { label: "Turi peržiūros kodą?", submit: "Įeiti", submitting: "Tikrinama..." } as const;

/** Preview code on the gate page; the right code sets the pass cookie and reloads the page the visitor asked for. */
export function GateCodeForm() {
  const { register, handleSubmit, setError, formState } = useForm<GateCodeValues>({
    resolver: zodResolver(gateCodeSchema),
    defaultValues: { code: "" },
  });
  const error = formState.errors.code?.message;

  const submit = handleSubmit(async (values) => {
    const result = await enterSiteGate(values);
    if ("error" in result) return setError("code", { message: result.error });
    // The gate rewrote this URL; load it again, now with the cookie. Coming straight to /netrukus goes home.
    window.location.assign(window.location.pathname === GATE_PATH ? "/" : window.location.href);
  });

  return (
    <form onSubmit={submit} className="grid max-w-md gap-2" noValidate>
      <Label htmlFor="gate-code" className="text-micro uppercase">
        {COPY.label}
      </Label>
      <div className="flex gap-2">
        <Input
          id="gate-code"
          type="password"
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "gate-code-error" : undefined}
          className="min-h-11 flex-1 rounded-none border-line-on-ink bg-transparent text-dust"
          {...register("code")}
        />
        <Cta tone="coral" small type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? COPY.submitting : COPY.submit}
        </Cta>
      </div>
      {error ? (
        <p id="gate-code-error" role="alert" className="text-xs text-rust">
          {error}
        </p>
      ) : null}
    </form>
  );
}
