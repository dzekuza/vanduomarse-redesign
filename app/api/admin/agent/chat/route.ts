import { NextResponse } from "next/server";
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { openApproval, overRateLimit, releaseApproval, signApproval } from "@/lib/admin/agent/approval";
import { AGENT_SYSTEM_PROMPT } from "@/lib/admin/agent/system-prompt";
import { AGENT_TOOL_DECLARATIONS, MUTATING_AGENT_TOOLS, executeAgentTool } from "@/lib/admin/agent/tools";
import type { AgentChatRequest, AgentMessage, AgentPendingAction, AgentToolCallTrace } from "@/lib/admin/agent/types";
import { currentStaff } from "@/lib/admin/repository";
import { createClient } from "@/lib/supabase/server";

/** Longest conversation and message the route forwards to the model. */
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { user, staff, access } = await currentStaff(supabase);

    if (!user || !staff || !staff.active || !access) {
      return NextResponse.json(
        { error: "Prieiga apribota. Prisijunkite prie /admin sistemos." },
        { status: 401 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY nenustatytas serveryje. Įrašykite raktą į .env.local failą.",
        },
        { status: 500 },
      );
    }

    const body = (await req.json()) as AgentChatRequest;

    if (overRateLimit(user.id)) {
      return NextResponse.json({ error: "Per daug užklausų. Palaukite minutę." }, { status: 429 });
    }

    // A staff member approved a change the assistant proposed: run exactly what the server signed, once.
    if (body?.approve) {
      const opened = openApproval(String(body.approve.token ?? ""), user.id);
      if ("error" in opened) return NextResponse.json({ error: opened.error }, { status: 400 });
      const { name, args } = opened;
      if (!MUTATING_AGENT_TOOLS.has(name)) return NextResponse.json({ error: "Nežinomas veiksmas." }, { status: 400 });
      const result = await executeAgentTool(name, args, access);
      if (!result.ok) {
        releaseApproval(body.approve.token);
        return NextResponse.json({ error: result.summary }, { status: 422 });
      }
      return NextResponse.json({
        message: {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: result.summary,
          toolCalls: [{ id: `call_${Date.now()}`, name, args, result: result.data, status: "done", summary: result.summary }],
          actionLinks: result.actionLinks,
          createdAt: new Date().toISOString(),
        } satisfies AgentMessage,
      });
    }

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Tuščia žinučių istorija." }, { status: 400 });
    }
    if (body.messages.length > MAX_MESSAGES || body.messages.some((m) => typeof m.content !== "string" || m.content.length > MAX_CHARS)) {
      return NextResponse.json({ error: "Pokalbis per ilgas. Išvalykite jį ir bandykite iš naujo." }, { status: 413 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Format chat history for Gemini contents
    const contents: Content[] = body.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const toolTraces: AgentToolCallTrace[] = [];
    const collectedActionLinks: Array<{ label: string; href: string }> = [];
    const pendingActions: AgentPendingAction[] = [];

    let maxLoops = 5;
    let finalAssistantText = "";

    while (maxLoops > 0) {
      maxLoops--;

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: AGENT_TOOL_DECLARATIONS }],
        },
      });

      const candidate = response.candidates?.[0];
      const parts = (candidate?.content?.parts ?? []) as Part[];
      const functionCalls = response.functionCalls ?? [];

      if (functionCalls.length > 0) {
        // Record model turn in conversation
        contents.push({
          role: "model",
          parts,
        });

        // Execute each requested tool
        const responseParts: Part[] = [];

        for (const call of functionCalls) {
          const toolName = call.name;
          if (!toolName) continue;

          const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const callArgs = (call.args as Record<string, unknown>) ?? {};

          // Customer-entered text (notes, names) comes back in tool results, so a change is never run from here:
          // it is queued for the staff member to approve.
          if (MUTATING_AGENT_TOOLS.has(toolName)) {
            const token = signApproval(user.id, toolName, callArgs);
            if (!token) {
              responseParts.push({ functionResponse: { name: toolName, response: { output: { ok: false, summary: "Veiksmo patvirtinimas nesukonfigūruotas serveryje." } } } });
              continue;
            }
            pendingActions.push({ id: callId, name: toolName, args: callArgs, token, status: "pending" });
            responseParts.push({
              functionResponse: {
                name: toolName,
                response: { output: { ok: true, summary: "Laukia darbuotojo patvirtinimo. Dar neįvykdyta; paprašyk patvirtinti pateiktą veiksmą." } },
              },
            });
            continue;
          }

          const toolResult = await executeAgentTool(toolName, callArgs, access);

          toolTraces.push({
            id: callId,
            name: toolName,
            args: callArgs,
            result: toolResult.data,
            status: toolResult.ok ? "done" : "error",
            summary: toolResult.summary,
          });

          if (toolResult.actionLinks) {
            collectedActionLinks.push(...toolResult.actionLinks);
          }

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: {
                output: toolResult,
              },
            },
          });
        }

        // Return tool outputs to the model
        contents.push({
          role: "user",
          parts: responseParts,
        });
      } else {
        // No more function calls, we have the final assistant response
        finalAssistantText = response.text || "";
        break;
      }
    }

    const assistantMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: finalAssistantText || (pendingActions.length > 0 ? "Patvirtinkite arba atmeskite pasiūlytą veiksmą." : "Asistentas negrąžino atsakymo. Bandykite performuluoti užklausą."),
      toolCalls: toolTraces.length > 0 ? toolTraces : undefined,
      actionLinks: collectedActionLinks.length > 0 ? collectedActionLinks : undefined,
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ message: assistantMessage });
  } catch (err: unknown) {
    console.error("Agent chat error:", err);
    const message = err instanceof Error ? err.message : "Nežinoma serverio klaida";
    return NextResponse.json({ error: `Klaida kreipiantis į Gemini: ${message}` }, { status: 500 });
  }
}
