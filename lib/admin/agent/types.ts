export type AgentRole = "user" | "assistant" | "system";

export interface AgentToolCallTrace {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "running" | "done" | "error";
  summary?: string;
}

export interface AgentActionLink {
  label: string;
  href: string;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  toolCalls?: AgentToolCallTrace[];
  actionLinks?: AgentActionLink[];
  createdAt: string;
}

export interface AgentChatRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AgentChatResponse {
  message: AgentMessage;
  error?: string;
}
