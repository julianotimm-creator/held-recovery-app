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

    // Buscar dados atuais do usuário
    const { data: userProfile } = await supabase
      .from("public.users")
      .select("subscription_active, free_messages_used")
      .eq("id", userId)
      .maybeSingle();

    // Bloquear se sem assinatura e passou 10 mensagens gratuitas
    if (!userProfile?.subscription_active && (userProfile?.free_messages_used ?? 0) >= FREE_MESSAGE_LIMIT) {
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

    const reply = await generateReply(userId, [
      ...history,
      { role: "user", content: data.content },
    ]);

    // HELD Learning System: salva a interação e atualiza o perfil do usuário
    // para futuras personalizações. Fire-and-forget: as duas funções já
    // engolem seus próprios erros internamente, e não devem atrasar a
    // resposta do chat nem quebrá-lo se a tabela ainda não existir.
    const { saveInteractionData } = await import("./interactionLogger.server");
    const { updateUserProfile } = await import("./userProfileUpdater.server");
    saveInteractionData(userId, { userMessage: data.content, claudeResponse: reply }).catch(
      (err) => console.error("[interactionLogger] failed to save interaction:", err),
    );
    updateUserProfile(userId).catch((err) =>
      console.error("[userProfileUpdater] failed to update profile:", err),
    );

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    // Incrementar contadores: free_messages_used se sem assinatura, message_count se pago
    // Contar como 1 "turn" (user + assistant response)
    if (!userProfile?.subscription_active) {
      // Usuário sem assinatura: incrementar free_messages_used
      await supabase
        .from("public.users")
        .update({ free_messages_used: (userProfile?.free_messages_used ?? 0) + 1 })
        .eq("id", userId);
    } else {
      // Usuário com assinatura: incrementar message_count usando RPC para evitar race conditions
      await supabase.rpc("increment_message_count", { user_id: userId });
    }

    return loadState(supabase, userId);
  });
