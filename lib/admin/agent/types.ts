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

/** A change the model asked for; nothing runs until a staff member approves it. */
export interface AgentPendingAction {
  id: string;
  name: string;
  args: Record<string, unknown>;
  /** Signed by the server; the only thing the approve request sends. */
  token: string;
  status: "pending" | "approved" | "rejected";
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  toolCalls?: AgentToolCallTrace[];
  actionLinks?: AgentActionLink[];
  pendingActions?: AgentPendingAction[];
  createdAt: string;
}

export interface AgentChatRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  /** A staff member's click on "Patvirtinti": run this change directly, without asking the model. */
  approve?: { token: string };
}

export interface AgentChatResponse {
  message?: AgentMessage;
  error?: string;
  /** The change may have been saved: the action must not be offered again. */
  indeterminate?: boolean;
}
