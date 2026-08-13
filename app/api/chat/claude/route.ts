import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseRest } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FREE_MESSAGE_LIMIT = 10;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, preferred_name, userId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const userResult = await supabaseRest("GET", `/users?id=eq.${userId}&select=*`);
    const user = Array.isArray(userResult) ? userResult[0] : userResult;

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const freeMessagesUsed = user.free_messages_used ?? 0;
    const subscriptionActive = user.subscription_active ?? false;

    if (!subscriptionActive && freeMessagesUsed >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: "Limite de mensagens grátis atingido" },
        { status: 403 }
      );
    }

    const systemPrompt = `Você é HELD, um companheiro de IA para recuperação.
Você oferece apoio caloroso e não julgador para pessoas navegando depressão, pânico e dependência.
Responda em português de forma breve (máx 200 tokens), acolhedora e humanizada.
${preferred_name ? `A pessoa se chama ${preferred_name}.` : ""}
Nunca faça diagnósticos, sempre sugira recursos de crise se apropriado (CVV 188 no Brasil; 988 ou 911 nos EUA).`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    await supabaseRest("PATCH", `/users?id=eq.${userId}`, {
      free_messages_used: freeMessagesUsed + 1,
      message_count: (user.message_count ?? 0) + 1,
    });

    return NextResponse.json({
      role: "assistant",
      content: text,
      freeMessagesUsed: freeMessagesUsed + 1,
    });
  } catch (error) {
    console.error("Claude error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
