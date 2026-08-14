import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const result = await supabaseRest('GET', `/users?id=eq.${id}&select=*`);
    const user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[USER] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id as string | undefined;
    const email = body?.email as string | undefined;

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const existing = await supabaseRest('GET', `/users?id=eq.${id}&select=*`);
    const existingUser = Array.isArray(existing) ? existing[0] : existing;

    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    const result = await supabaseRest('POST', '/users', { id, email });
    const user = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[USER] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    const email = body?.email as string | undefined;
    const preferredName = body?.preferredName as string | undefined;

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const update: Record<string, string> = {};
    if (email) update.email = email;
    if (preferredName) update.preferred_name = preferredName;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    const result = await supabaseRest('PATCH', `/users?id=eq.${id}`, update);
    const user = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[USER] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}
