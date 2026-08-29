import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { FIRST_MESSAGE_GREETING, FREE_MESSAGE_LIMIT, type ChatMessage, type ChatState } from "./chat-core";

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

  let messages: ChatMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    role: r.role === "assistant" ? "assistant" : "user",
    content: r.content,
    created_at: r.created_at,
  }));

  // Immutable rule: a brand-new user's very first message from HELD must be
  // the name-greeting, before anything else. Seed it server-side on first
  // load so it exists ahead of any user input or LLM call.
  if (messages.length === 0) {
    const conversationId = await ensureConversation(supabase, userId);
    const { data: greeting } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: userId, role: "assistant", content: FIRST_MESSAGE_GREETING })
      .select("id, role, content, created_at")
      .single();

    if (greeting) {
      messages = [
        { id: greeting.id, role: "assistant", content: greeting.content, created_at: greeting.created_at },
      ];
    }
  } else if (profile?.preferred_name && messages.length > 0) {
    // Returning user, name already known: greet them by name once per new
    // calendar day, instead of silently resuming — proves continuity.
    const last = messages[messages.length - 1]!;
    const isNewDay = new Date(last.created_at).toDateString() !== new Date().toDateString();
    if (isNewDay) {
      const conversationId = await ensureConversation(supabase, userId);
      const { data: welcomeBack } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: `Hi ${profile.preferred_name}! Good to see you again. How are you today?`,
        })
        .select("id, role, content, created_at")
        .single();

      if (welcomeBack) {
        messages = [
          ...messages,
          { id: welcomeBack.id, role: "assistant", content: welcomeBack.content, created_at: welcomeBack.created_at },
        ];
      }
    }
  }

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
  preferredName?: string | null,
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
    preferredName ?? undefined,
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
