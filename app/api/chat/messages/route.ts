import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    const messages = await supabaseRest(
      'GET',
      `/messages?conversation_id=eq.${conversationId}&order=created_at.asc`
    );

    return NextResponse.json({ 
      messages: Array.isArray(messages) ? messages : [] 
    });
  } catch (error) {
    console.error('[MESSAGES] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const conversationId = body?.conversationId as string | undefined;
    const content = body?.content as string | undefined;
    const role = body?.role as string | undefined;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'conversationId e content são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await supabaseRest('POST', '/messages', {
      conversation_id: conversationId,
      content,
      role: role || 'user',
    });

    const message = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[MESSAGES] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar mensagem' },
      { status: 500 }
    );
  }
}
