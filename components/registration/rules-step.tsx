"use client";

import { useRef, useState } from "react";
import { PARK_RULES_TEXT, PARK_RULES_TITLE, POOL_RULES_TEXT, POOL_RULES_TITLE } from "@/lib/park-rules";
import { Button } from "@/components/ui/button";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

interface RulesStepProps {
  fullName: string;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (signature: Blob) => void;
}

function RuleText({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">{title}</p>
      {text.split("\n\n").map((paragraph, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

const today = new Date().toLocaleDateString("lt-LT", { day: "numeric", month: "long", year: "numeric" });

/** Step 3: scrollable rules, a consent line, a signature pad, and the final submit. */
export function RulesStep({ fullName, submitting, error, onBack, onSubmit }: RulesStepProps) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [hasInk, setHasInk] = useState(false);

  async function handleSubmit() {
    const blob = await padRef.current?.toBlob();
    if (blob) onSubmit(blob);
  }

  return (
    <div className="space-y-5">
      <div className="max-h-[50vh] space-y-8 overflow-y-auto rounded-lg border border-border p-4">
        <RuleText title={PARK_RULES_TITLE} text={PARK_RULES_TEXT} />
        <RuleText title={POOL_RULES_TITLE} text={POOL_RULES_TEXT} />
      </div>

      <p className="text-sm">
        Aš, <span className="font-bold">{fullName}</span>, sutinku su aukščiau aprašytomis sąlygomis.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-bold">Parašas</p>
        <SignaturePad ref={padRef} onChange={setHasInk} />
        <div className="flex items-center justify-between">
          <button type="button" className="text-sm underline underline-offset-4 text-muted-foreground" onClick={() => padRef.current?.clear()}>
            Išvalyti parašą
          </button>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="min-h-11 flex-1" disabled={submitting} onClick={onBack}>
          Atgal
        </Button>
        <Button type="button" className="min-h-11 flex-1" disabled={!hasInk || submitting} onClick={handleSubmit}>
          {submitting ? "Siunčiama…" : "Sutinku ir pasirašau"}
        </Button>
      </div>
    </div>
  );
}
