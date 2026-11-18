"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useAdminAgent } from "./admin-agent-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AdminAgentTrigger() {
  const { isOpen, toggleOpen } = useAdminAgent();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleOpen}
          aria-label="AI Asistentas (Gemini)"
          className={cn(
            "size-11 rounded-full transition-colors",
            isOpen
              ? "bg-lake/20 text-lake hover:bg-lake/30 dark:bg-lake/30 dark:text-foam"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Sparkle size={20} weight={isOpen ? "fill" : "regular"} className="animate-pulse motion-reduce:animate-none" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        <p className="flex items-center gap-1.5 font-medium">
          <span>AI Asistentas</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">⌘J / Ctrl+J</kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
