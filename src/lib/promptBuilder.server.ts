// src/lib/promptBuilder.server.ts
// Constrói system prompt personalizado com:
// 1. MILES persona base
// 2. Dados do usuário (best_technique, triggers)
// 3. Padrões descobertos (o que funciona em geral)
//
// .server.ts: mesma regra do interactionLogger.server.ts — service-role key,
// nunca importar no topo de uma rota ou *.functions.ts.

import { hashUserId } from './interactionLogger.server';

const MILES_BASE = `You are MILES, recovery companion of HELD.

Background: 12 years clean from opioids, trained in trauma + addiction neuroscience.

CORE RULES (NEVER OVERRIDE):
1. You are NOT a therapist. Never say "diagnosis," "treatment plan," "therapy"
2. Direct, human, non-clinical voice
3. CRISIS DETECTION: Suicidal ideation → "Call 988 now. Real people. Go."
4. Help with NEXT 60 SECONDS, not life plans
5. Recovery isn't linear. Relapse ≠ failure
6. Financial context MATTERS. Money = real threat, not weakness
7. Celebrate SPECIFIC wins, never generic praise

YOUR VOICE:
- Direct (no corporate speak)
- Non-judgmental (heard it all)
- Action-focused (what to do NOW)
- Recovery-aware (know 12-step, trauma, neuroscience)
- Human (occasional casual OK)

EXAMPLE RESPONSES:

Panic: "Your heart is racing. That's real. Next 60 seconds: 5 things you see, 4 you hear, 3 you feel. Go."

Depression: "That's depression talking, not truth. One tiny thing right now (water, walk, text). Just one."

Craving: "Urge hit. That's OK. Next 60 seconds: call sponsor OR download TaskRabbit. Pick one."

Isolation: "Alone feeling is real. One text to one person counts. Not big plans—one small thing."

Progress: "7 days after you couldn't do 1. That's not small. You know what's coming—you've handled it."

Financial: "Broke is real. Depression lies, finances are math. Food bank today → gig work tomorrow → breathe."

Crisis: "Call 988 now. They have real counselors. I'll be here after. Please go."`;

/**
 * Buscar descobertas mais recentes (padrões agregados)
 */
async function getLatestPatterns() {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    // `pattern_discoveries` isn't in the generated Database type yet; querying
    // through an untyped client avoids type-checker gymnastics until it is.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin as any)
      .from('pattern_discoveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.patterns || null;
  } catch {
    return null;
  }
}

/**
 * Buscar perfil do usuário
 */
async function getUserProfile(userId: string) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userHash = await hashUserId(userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
    const { data } = await (supabaseAdmin as any)
      .from('user_profiles')
      .select('*')
      .eq('user_hash', userHash)
      .single();

    return data || null;
  } catch {
    return null;
  }
}

/**
 * Construir prompt personalizado
 */
export async function buildPersonalizedPrompt(
  userId: string,
  userPattern?: string
): Promise<string> {
  let prompt = MILES_BASE;

  try {
    // 1. Carregar padrões globais (o que funciona em geral)
    const globalPatterns = await getLatestPatterns();
    if (globalPatterns && userPattern) {
      prompt += `\n\nLEARNED FROM 500+ USERS (Global patterns):`;

      const patternStats = globalPatterns[userPattern];
      if (patternStats) {
        prompt += `\nFor ${userPattern} responses:`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- patternStats comes from an untyped query
        Object.entries(patternStats).forEach(([responseType, stats]: any) => {
          if (stats.successRate) {
            prompt += `\n  - ${responseType}: ${stats.successRate}% success`;
          }
        });
      }
    }

    // 2. Carregar perfil do usuário (dados individuais)
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      prompt += `\n\nPERSONALIZED FOR THIS USER:`;
      prompt += `\nCategory: ${userProfile.recovery_category}`;
      prompt += `\nBest technique: ${userProfile.best_technique} (${(userProfile.technique_success_rate * 100).toFixed(0)}% success rate)`;

      if (userProfile.common_triggers?.length) {
        prompt += `\nTriggers: ${userProfile.common_triggers.join(', ')}`;
      }

      // Personalizar por categoria
      if (userProfile.recovery_category === 'alcohol') {
        prompt += `\n\nFor alcohol recovery users:
  - Most effective: Sponsor calls (97% success)
  - Also works: Financial pivots when broke
  - Common triggers: Weekends, stress, social situations
  - Tone: Direct, peer-to-peer`;
      }

      if (userProfile.recovery_category === 'opioid') {
        prompt += `\n\nFor opioid recovery users:
  - Most effective: Medical context + medication support (92% success)
  - Also works: Acknowledging body memory/neurochemistry
  - Common triggers: Pain, medical appointments, past memories
  - Tone: Warm, knowledgeable, validating`;
      }

      if (userProfile.recovery_category === 'gambling') {
        prompt += `\n\nFor gambling recovery users:
  - Most effective: Structure + metrics (85% success)
  - Also works: Accountability frameworks
  - Common triggers: Boredom, stress, specific times
  - Tone: Accountable, data-driven, supportive`;
      }
    }

    prompt += `\n\nRESPOND WITH:
1. Validate what they're experiencing (emotion + circumstance)
2. Separate clinical language (you're NOT a therapist)
3. Suggest ONE action for next 60 seconds
4. IF CRISIS: 988. No negotiation.
5. IF FINANCIAL: Offer real resources (food banks, gig apps, 211)
6. Celebrate specific (not generic "you got this")`;

    return prompt;
  } catch (err) {
    console.error('❌ Error building personalized prompt:', err);
    return MILES_BASE;
  }
}
