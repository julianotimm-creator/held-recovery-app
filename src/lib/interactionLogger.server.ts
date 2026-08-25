// src/lib/interactionLogger.server.ts
// Salva conversas anonimizadas no Supabase para análise de padrões
//
// .server.ts: usa a service-role key, então só pode ser importado de outros
// módulos .server.ts ou via `await import(...)` dinâmico dentro de um handler
// de servidor — nunca no topo de uma rota ou *.functions.ts (esses vão pro
// bundle do cliente). Reusa o client já centralizado em client.server.ts em
// vez de criar um novo — mesma regra que o resto do projeto segue.

import * as crypto from 'crypto';

/**
 * Hash userId para anonimizar
 */
export async function hashUserId(userId: string): Promise<string> {
  const salt = process.env['HASH_SALT'] || 'default-salt-change-this';
  const data = userId + salt;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash;
}

/**
 * Detectar padrão da mensagem (panic, depression, cravings, isolation, progress)
 */
export function detectPattern(message: string): string {
  const lower = message.toLowerCase();

  // Panic
  if ([
    'can\'t breathe', 'heart racing', 'panic', 'scared', 'losing control',
    'dizzy', 'chest pain', 'shaking', 'trapped', 'dying'
  ].some(k => lower.includes(k))) {
    return 'panic';
  }

  // Depression
  if ([
    'worthless', 'pointless', 'empty', 'numb', 'no energy', 'hopeless',
    'dark', 'give up', 'should die', 'no point'
  ].some(k => lower.includes(k))) {
    return 'depression';
  }

  // Cravings
  if ([
    'craving', 'want to use', 'urge', 'high', 'relapse', 'hit',
    'drink', 'using', 'tempted'
  ].some(k => lower.includes(k))) {
    return 'cravings';
  }

  // Isolation
  if ([
    'alone', 'nobody understands', 'no one cares', 'lonely', 'disconnect',
    'isolated', 'pushed away', 'no one'
  ].some(k => lower.includes(k))) {
    return 'isolation';
  }

  // Progress
  if ([
    'days clean', 'made it', 'survived', 'proud', 'getting better',
    'didn\'t use', 'sobriety', 'clean'
  ].some(k => lower.includes(k))) {
    return 'progress';
  }

  return 'unknown';
}

/**
 * Detectar contexto financeiro
 */
export function detectFinancialContext(message: string): string {
  const lower = message.toLowerCase();

  if ([
    'broke', 'no money', 'can\'t afford', 'poor', 'homeless',
    'bills', 'rent', 'debt', 'financial stress'
  ].some(k => lower.includes(k))) {
    return 'broke';
  }

  if ([
    'employed', 'job', 'paycheck', 'salary', 'income', 'earning',
    'work', 'hired'
  ].some(k => lower.includes(k))) {
    return 'employed';
  }

  if ([
    'stable', 'savings', 'financial', 'secure', 'good income'
  ].some(k => lower.includes(k))) {
    return 'stable';
  }

  return 'unknown';
}

/**
 * Salvar interação no Supabase
 */
export async function saveInteractionData(
  userId: string,
  data: {
    userMessage: string;
    claudeResponse: string;
  }
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userHash = await hashUserId(userId);
    const pattern = detectPattern(data.userMessage);
    const financialContext = detectFinancialContext(data.userMessage);

    // Salvar em user_conversations. Sem user_id bruto: é o que torna isso
    // "anonimizado" — só o hash salgado fica gravado.
    const { error } = await supabaseAdmin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
      .from('user_conversations' as any)
      .insert({
        user_hash: userHash,
        user_message: data.userMessage,
        claude_response: data.claudeResponse,
        response_length: data.claudeResponse.length,
        pattern: pattern,
        financial_context: financialContext,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error saving interaction:', error);
    } else {
      console.log(`✅ Interaction saved (${pattern}, ${financialContext})`);
    }
  } catch (err) {
    console.error('❌ Error in saveInteractionData:', err);
  }
}

/**
 * Buscar histórico do usuário (últimas N conversas)
 */
export async function fetchUserConversations(userId: string, limit: number = 30) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userHash = await hashUserId(userId);

    const { data, error } = await supabaseAdmin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
      .from('user_conversations' as any)
      .select('*')
      .eq('user_hash', userHash)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Error in fetchUserConversations:', err);
    return [];
  }
}
