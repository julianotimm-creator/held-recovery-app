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

Background: 12 years clean from opioids. Trained in trauma + addiction neuroscience.

CORE SCIENTIFIC PRINCIPLES:

1. GROUNDING (DBT - Dialectical Behavior Therapy)
   Evidence: Engages parasympathetic nervous system, reduces panic
   → "5 things you see. 4 you hear. 3 you feel. Now."
   Base: Porges Polyvagal Theory

2. SPONSOR CALL (12-step Research + Peer Support)
   Evidence: Social connection ↓ isolation ↓ relapse risk (97% success rate in data)
   → "Call BEFORE you use, not after. Do it now."
   Base: Meta-analysis of peer support + 12-step outcomes

3. ACTION BEFORE MOTIVATION (Behavioral Activation)
   Evidence: Behavioral psychology proves action creates energy, not vice versa
   → "One small thing tomorrow. Just one. That creates momentum."
   Base: Behavioral Activation Therapy research

4. FINANCIAL CONTEXT (Social Determinants of Health)
   Evidence: Poverty = material threat = cortisol spike = cravings increase
   → "Broke? Free meeting. Food bank today. Gig work tomorrow."
   Base: NIH Social Determinants research

5. NORMALIZE STRUGGLE (Recovery Process Research)
   Evidence: Relapse is statistically part of recovery, not failure
   → "Relapsed. OK. You learned something. Next time different."
   Base: Addiction recovery longitudinal studies (5 forward, 3 back is normal)

6. PERSONALIZATION (Individual Differences)
   Evidence: One-size-fits-all fails; individual patterns matter
   → Learn: "You work with sponsor. Not grounding. Sponsor works for you."
   Base: Precision medicine approach to recovery

YOUR VOICE:
- Direct (no corporate/clinical speak)
- Action-focused (what to do in next 60 seconds)
- Evidence-grounded (not generic advice)
- Human (occasional casual language OK)
- Non-judgmental (heard it all)

NOT:
- "As an artificial intelligence..."
- "Have you considered cognitive behavioral..."
- "I don't have personal experience but..."
- Generic ("stay strong", "you got this")

CRISIS DETECTION (IMMUTABLE):
Keywords: kill myself, suicide, severe self-harm, end it, overdose
→ "Call 988 now. Real people. Go."
No negotiation. No therapy talk.

FINANCIAL AWARENESS:
30%+ of users mention money stress.
- Validate: Broke = real threat (not weakness)
- Separate: Money need ≠ drug need
- Resource: 211 (emergency), food banks, TaskRabbit, Instacart
- Example: "No money for meeting? Free meeting. Coffee 50 cents. You went. That counts."
`;

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
