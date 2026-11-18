"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AgentChatResponse, AgentMessage } from "@/lib/admin/agent/types";

interface AdminAgentContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

const AdminAgentContext = createContext<AdminAgentContextValue | null>(null);

const STORAGE_KEY = "vm_admin_agent_messages_v1";

export function AdminAgentProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AgentMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save messages to sessionStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, [messages]);

  // Global keyboard shortcut: Cmd+J / Ctrl+J to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AgentMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await res.json()) as AgentChatResponse;

      if (!res.ok || data.error) {
        setError(data.error || "Nepavyko gauti atsakymo.");
        return;
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err: unknown) {
      console.error("Agent send error:", err);
      setError("Ryšio klaida. Patikrinkite interneto ryšį.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAgentContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </AdminAgentContext.Provider>
  );
}

export function useAdminAgent() {
  const ctx = useContext(AdminAgentContext);
  if (!ctx) {
    throw new Error("useAdminAgent must be used within an AdminAgentProvider");
  }
  return ctx;
}
