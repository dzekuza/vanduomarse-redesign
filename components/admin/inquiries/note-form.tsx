"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({ text: z.string().trim().min(2, "Įrašykite bent kelis žodžius.").max(1000) });
type NoteValues = z.infer<typeof schema>;

/** Adds an internal follow-up note to an inquiry. */
export function NoteForm({ onAdd }: { onAdd: (text: string) => void }) {
  const { register, handleSubmit, reset, formState } = useForm<NoteValues>({ resolver: zodResolver(schema), defaultValues: { text: "" } });

  return (
    <form
      onSubmit={handleSubmit((v) => {
        onAdd(v.text);
        reset();
      })}
      className="space-y-2"
    >
      <Label htmlFor="note">Nauja pastaba</Label>
      <Textarea id="note" rows={3} placeholder="Pvz., išsiųstas pasiūlymas, laukiam atsakymo iki penktadienio." aria-invalid={!!formState.errors.text} {...register("text")} />
      {formState.errors.text ? <p className="text-xs text-destructive">{formState.errors.text.message}</p> : null}
      <Button type="submit" variant="outline" className="w-full">
        Pridėti pastabą
      </Button>
    </form>
  );
}
