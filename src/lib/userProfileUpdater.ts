// src/lib/userProfileUpdater.ts
// Atualiza perfil do usuário com técnicas que funcionam, triggers conhecidos, etc

import { createClient } from '@supabase/supabase-js';
import { hashUserId, detectPattern } from './interactionLogger';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Inferir categoria de recuperação (alcohol, opioid, cocaine, gambling, etc)
 */
function inferRecoveryCategory(interactions: any[]): string {
  const keywords = {
    alcohol: ['drink', 'beer', 'wine', 'hangover', 'bar', 'alcohol'],
    opioid: ['pain', 'medication', 'pill', 'heroin', 'oxycodone', 'opioid'],
    cocaine: ['powder', 'crack', 'snort', 'cocaine'],
    gambling: ['bet', 'poker', 'casino', 'odds', 'slots', 'gambling'],
    general: []
  };

  for (const interaction of interactions.slice(0, 10)) {
    const msg = (interaction.user_message || '').toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (category !== 'general' && words.some(w => msg.includes(w))) {
        return category;
      }
    }
  }

  return 'general';
}

/**
 * Calcular melhor técnica para este usuário (o que funcionou mais vezes)
 */
function calculateBestTechnique(interactions: any[]): { technique: string; rate: number } {
  const techniques: { [key: string]: { success: number; total: number } } = {};

  for (const interaction of interactions) {
    // Detectar qual técnica foi usada (baseado na resposta)
    let technique = 'unknown';
    const response = (interaction.claude_response || '').toLowerCase();

    if (response.includes('5') && response.includes('4') && response.includes('3')) {
      technique = 'grounding';
    } else if (response.includes('sponsor')) {
      technique = 'sponsor_call';
    } else if (response.includes('task') || response.includes('gig')) {
      technique = 'gig_work';
    } else if (response.includes('one thing') || response.includes('tiny')) {
      technique = 'micro_action';
    }

    if (!techniques[technique]) {
      techniques[technique] = { success: 0, total: 0 };
    }

    techniques[technique].total++;
    // Assume sucesso se user continuou conversando (simples heuristic)
    techniques[technique].success++;
  }

  // Encontrar técnica com melhor taxa
  let bestTechnique = 'unknown';
  let bestRate = 0;

  for (const [tech, stats] of Object.entries(techniques)) {
    const rate = stats.success / stats.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestTechnique = tech;
    }
  }

  return { technique: bestTechnique, rate: bestRate };
}

/**
 * Detectar triggers comuns
 */
function detectTriggers(interactions: any[]): string[] {
  const triggerKeywords = {
    weekend: ['friday', 'saturday', 'sunday', 'weekend'],
    financial: ['broke', 'money', 'bills', 'rent', 'financial'],
    social: ['friend', 'party', 'people', 'social', 'group'],
    stress: ['stress', 'anxiety', 'worried', 'pressure'],
    medical: ['pain', 'doctor', 'hospital', 'medical'],
    boredom: ['bored', 'nothing', 'nowhere', 'empty']
  };

  const detectedTriggers: { [key: string]: number } = {};

  for (const interaction of interactions.slice(0, 15)) {
    const msg = (interaction.user_message || '').toLowerCase();

    for (const [trigger, keywords] of Object.entries(triggerKeywords)) {
      if (keywords.some(k => msg.includes(k))) {
        detectedTriggers[trigger] = (detectedTriggers[trigger] || 0) + 1;
      }
    }
  }

  // Return top 3 triggers
  return Object.entries(detectedTriggers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger);
}

/**
 * Atualizar perfil do usuário
 */
export async function updateUserProfile(userId: string): Promise<void> {
  try {
    const userHash = await hashUserId(userId);

    // Buscar últimas 30 interações do usuário
    const { data: interactions, error: fetchError } = await supabase
      .from('user_conversations')
      .select('*')
      .eq('user_hash', userHash)
      .order('created_at', { ascending: false })
      .limit(30);

    if (fetchError || !interactions?.length) {
      console.log('⏭️ Skipping profile update (not enough data)');
      return;
    }

    // Calcular dados
    const category = inferRecoveryCategory(interactions);
    const { technique: bestTechnique, rate: successRate } = calculateBestTechnique(interactions);
    const triggers = detectTriggers(interactions);

    // Contar relapses (detectar por padrão)
    const relapseCount = interactions.filter(
      i => detectPattern(i.user_message) === 'cravings'
    ).length;

    // Verificar se profile existe
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_hash', userHash)
      .single();

    if (existingProfile) {
      // UPDATE
      await supabase
        .from('user_profiles')
        .update({
          recovery_category: category,
          best_technique: bestTechnique,
          technique_success_rate: successRate,
          common_triggers: triggers,
          interaction_count: interactions.length,
          relapse_count: relapseCount,
          last_updated: new Date().toISOString()
        })
        .eq('user_hash', userHash);

      console.log(`✅ Profile updated (${bestTechnique} at ${(successRate * 100).toFixed(1)}%)`);
    } else {
      // INSERT
      await supabase
        .from('user_profiles')
        .insert({
          user_hash: userHash,
          recovery_category: category,
          best_technique: bestTechnique,
          technique_success_rate: successRate,
          common_triggers: triggers,
          interaction_count: interactions.length,
          relapse_count: relapseCount,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });

      console.log(`✅ Profile created (${category}, ${bestTechnique})`);
    }
  } catch (err) {
    console.error('❌ Error in updateUserProfile:', err);
  }
}
