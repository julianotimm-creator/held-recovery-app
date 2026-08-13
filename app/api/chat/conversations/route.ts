import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const conversations = await supabaseRest(
      'GET',
      `/conversations?user_id=eq.${userId}&order=created_at.desc`
    );

    return NextResponse.json({ 
      conversations: Array.isArray(conversations) ? conversations : [] 
    });
  } catch (error) {
    console.error('[CONVERSATIONS] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;
    const title = body?.title as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const result = await supabaseRest('POST', '/conversations', {
      user_id: userId,
      title: title?.trim() || 'Nova conversa',
    });

    const conversation = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('[CONVERSATIONS] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar conversa' },
      { status: 500 }
    );
  }
}
