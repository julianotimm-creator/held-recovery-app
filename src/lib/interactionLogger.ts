// src/lib/interactionLogger.ts
// Salva conversas anonimizadas no Supabase para análise de padrões

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Hash userId para anonimizar
 */
export async function hashUserId(userId: string): Promise<string> {
  const salt = process.env.HASH_SALT || 'default-salt-change-this';
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
    const userHash = await hashUserId(userId);
    const pattern = detectPattern(data.userMessage);
    const financialContext = detectFinancialContext(data.userMessage);

    // Salvar em user_conversations
    const { error } = await supabase
      .from('user_conversations')
      .insert({
        user_id: userId,
        user_hash: userHash,
        user_message: data.userMessage,
        claude_response: data.claudeResponse,
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
    const userHash = await hashUserId(userId);

    const { data, error } = await supabase
      .from('user_conversations')
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
