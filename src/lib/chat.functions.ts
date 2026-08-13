import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FREE_MESSAGE_LIMIT, type ChatState } from "./chat-core";

export const getChatState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatState> => {
    const { loadState } = await import("./chat-core.server");
    return loadState(context.supabase, context.userId);
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { content: string }) => {
    const content = String(input?.content ?? "").trim();
    if (!content) throw new Error("Mensagem vazia");
    if (content.length > 2000) throw new Error("Mensagem muito longa");
    return { content };
  })
  .handler(async ({ data, context }): Promise<ChatState> => {
    const { supabase, userId } = context;
    const { loadState, ensureConversation, generateReply } = await import("./chat-core.server");
    const state = await loadState(supabase, userId);

    if (!state.isPaid && state.messageCount >= FREE_MESSAGE_LIMIT) {
      throw new Error("LIMIT_REACHED");
    }

    const conversationId = await ensureConversation(supabase, userId);
    const history = state.messages.map((m) => ({ role: m.role, content: m.content }));

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: data.content,
    });

    const reply = await generateReply([...history, { role: "user", content: data.content }]);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    await supabase
      .from("users")
      .update({ message_count: state.messageCount + 1 })
      .eq("id", userId);

    return loadState(supabase, userId);
  });
