import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { FREE_MESSAGE_LIMIT, type ChatMessage, type ChatState } from "./chat-core";

type Client = SupabaseClient<Database>;

// The static system prompt used to live here; generateReply() now builds a
// personalized one per-request via promptBuilder.server.ts's MILES persona.

export async function ensureConversation(supabase: Client, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não foi possível iniciar a conversa");
  return data.id;
}

export async function loadState(supabase: Client, userId: string): Promise<ChatState> {
  const { data: profile } = await supabase
    .from("public.users")
    .select("anonymous_id, preferred_name, message_count, subscription_active, free_messages_used")
    .eq("id", userId)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const messages: ChatMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    role: r.role === "assistant" ? "assistant" : "user",
    content: r.content,
    created_at: r.created_at,
  }));

  const messageCount = profile?.message_count ?? 0;
  const freeMessagesUsed = profile?.free_messages_used ?? 0;
  const isPaid = profile?.subscription_active ?? false;

  return {
    username: profile?.preferred_name ?? profile?.anonymous_id ?? "User",
    isPaid,
    messageCount,
    remaining: isPaid ? Number.POSITIVE_INFINITY : Math.max(0, FREE_MESSAGE_LIMIT - freeMessagesUsed),
    messages,
  };
}

export async function generateReply(
  userId: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI indisponível no momento");

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const { detectPattern } = await import("./interactionLogger.server");
  const { buildPersonalizedPrompt } = await import("./promptBuilder.server");
  const pattern = detectPattern(lastUserMessage);
  const systemPrompt = await buildPersonalizedPrompt(
    userId,
    pattern === "unknown" ? undefined : pattern,
  );

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, ...history],
      max_tokens: 300,
    }),
  });

  if (res.status === 429) throw new Error("Muitas mensagens agora. Tente em instantes.");
  if (!res.ok) throw new Error("Não consegui responder agora. Tente de novo.");

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "Estou aqui com você.";
}
