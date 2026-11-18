"use client";

import { Broom, CircleNotch, PaperPlaneTilt, Sparkle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdminAgent } from "./admin-agent-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PROMPT_SUGGESTIONS = [
  "Kokie šiandienos atvykimai ir rezervacijos?",
  "Ar yra laisva Didžioji pirtis šį šeštadienį 18:00?",
  "Rask Tomo rezervacijas ir telefono numerį",
  "Užregistruok pirtį šiam penktadieniui 19 val. 6 asmenims",
];

export function AdminAgentPanel() {
  const { isOpen, setIsOpen, messages, isLoading, error, sendMessage, clearMessages } = useAdminAgent();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-lake/15 text-lake dark:bg-lake/25 dark:text-foam">
            <Sparkle size={18} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight">AI Asistentas</span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                Gemini 2.5
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Vanduo Marse valdymo pagalbininkas</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={clearMessages} aria-label="Išvalyti pokalbį" className="size-8 text-muted-foreground">
                  <Broom size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Išvalyti pokalbį</TooltipContent>
            </Tooltip>
          ) : null}

          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Uždaryti" className="size-8 text-muted-foreground">
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center text-center px-2 py-6">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-lake/10 text-lake dark:bg-lake/20">
              <Sparkle size={24} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold">Kuo galiu padėti šiandien?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Klauskite apie užimtumą, ieškokite klientų arba kurkite rezervacijas tiesiogiai.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pasiūlymai</span>
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground transition-colors hover:border-lake/50 hover:bg-lake/5 text-left active:scale-[0.99]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-1.5", msg.role === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-lake text-foam dark:bg-lake/90 font-medium"
                    : "bg-muted/50 border border-border/50 text-foreground",
                )}
              >
                {/* Tool calls execution badges */}
                {msg.toolCalls && msg.toolCalls.length > 0 ? (
                  <div className="mb-2 space-y-1">
                    {msg.toolCalls.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono",
                          t.status === "error"
                            ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                            : "border-lake/30 bg-lake/10 text-lake dark:text-foam",
                        )}
                      >
                        <span className="font-bold">⚡ {t.name}</span>
                        {t.summary ? <span className="truncate opacity-80">— {t.summary}</span> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Formatted message content */}
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Action Links */}
                {msg.actionLinks && msg.actionLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
                    {msg.actionLinks.map((link, idx) => (
                      <Button key={idx} variant="secondary" size="sm" asChild className="h-7 text-xs font-semibold">
                        <Link href={link.href}>{link.label} →</Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span className="text-[10px] text-muted-foreground px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/30 px-3 py-2 text-xs text-muted-foreground w-fit">
            <CircleNotch size={14} className="animate-spin text-lake" />
            <span>Gemini apdoroja užklausą...</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="shrink-0 border-t bg-background p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paklauskite agento (pvz. laisvi laikai, sukurti užsakymą)..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-input bg-muted/20 px-3.5 py-2.5 text-xs sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lake max-h-32 min-h-11"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="size-11 shrink-0 rounded-xl bg-lake text-foam hover:bg-lake/90 disabled:opacity-50"
            aria-label="Siųsti"
          >
            {isLoading ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} weight="bold" />}
          </Button>
        </form>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          Enter – siųsti, Shift+Enter – nauja eilutė
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop 3rd column: docked alongside main when open */}
      {isOpen ? (
        <aside
          aria-label="AI Asistentas"
          className="hidden xl:flex w-[380px] 2xl:w-[420px] shrink-0 border-l bg-background sticky top-16 h-[calc(100vh-4rem)] z-10 overflow-hidden"
        >
          {renderContent()}
        </aside>
      ) : null}

      {/* Mobile / tablet view: Sheet slide-over */}
      <div className="xl:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetTitle className="sr-only">AI Asistentas</SheetTitle>
            {renderContent()}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
