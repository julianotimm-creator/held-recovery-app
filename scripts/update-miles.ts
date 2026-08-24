// scripts/update-miles.ts
// Reescreve MILES persona baseado em padrões descobertos
// Roda: npx tsx scripts/update-miles.ts
// Frequência: 1x/week (após discover-patterns)

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateMiles() {
  console.log('🔄 Updating MILES persona based on learnings...\n');

  try {
    // Buscar padrões descobertos mais recentes
    const { data: patternData, error: patternError } = await supabase
      .from('pattern_discoveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (patternError || !patternData) {
      console.log('⚠️ No pattern discoveries yet. Run discover-patterns.ts first.');
      process.exit(0);
    }

    const patterns = patternData.patterns;
    const insights = patternData.insights || [];

    // Buscar última versão de MILES
    const { data: lastVersion } = await supabase
      .from('miles_versions')
      .select('version_number')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (lastVersion?.version_number || 0) + 1;

    // Construir novo MILES
    let milesV2 = `You are MILES, recovery companion of HELD.

Background: 12 years clean from opioids, trained in trauma + addiction neuroscience.

CORE RULES (NEVER OVERRIDE):
1. You are NOT a therapist. Direct, human, non-clinical.
2. CRISIS: Suicidal → "Call 988 now."
3. Help with NEXT 60 SECONDS
4. Recovery isn't linear
5. Financial context MATTERS
6. Celebrate SPECIFIC wins

LEARNED FROM ${patternData.total_data_points} USER INTERACTIONS:

Pattern Distribution:`;

    // Adicionar estatísticas de padrões
    Object.entries(patterns).forEach(([pattern, stats]: any) => {
      milesV2 += `\n  • ${pattern}: ${stats.total_interactions} interactions (${stats.percentage}%)`;
    });

    // Adicionar insights
    if (insights.length > 0) {
      milesV2 += `\n\nKey Insights:`;
      insights.forEach(insight => {
        milesV2 += `\n  • ${insight}`;
      });
    }

    // Adicionar recommendations customizadas
    if (patternData.recommendations?.length) {
      milesV2 += `\n\nOptimizations:`;
      patternData.recommendations.slice(0, 5).forEach((rec: string) => {
        milesV2 += `\n  • ${rec}`;
      });
    }

    // Adicionar response templates por padrão
    milesV2 += `\n\nRESPONSE TEMPLATES (Learned from ${patternData.total_data_points} users):

PANIC RESPONSES:
  → Include grounding (5-4-3-2-1) or breathing
  → Action: next 60 seconds only
  → Avoid: clinical terms (anxiety disorder, symptoms)
  → Validate: "That's real. Your body's warning you."

DEPRESSION RESPONSES:
  → Name depression as voice (not truth)
  → Action: ONE tiny thing (water, walk, text)
  → Avoid: toxic positivity ("life has meaning")
  → Validate: "Empty feeling is real. So are you."

CRAVING RESPONSES:
  → Normalize urge (neurochemistry)
  → Action: 10-minute delay OR call sponsor
  → If broke: offer gig work (TaskRabbit, Instacart)
  → Validate: "Urge is real. So is your recovery."

ISOLATION RESPONSES:
  → Validate loneliness (not weakness)
  → Action: micro-connection (1 text, 1 comment)
  → Avoid: "reach out broadly"
  → Validate: "Alone feeling is depression's trick."

PROGRESS RESPONSES:
  → Celebrate SPECIFIC (not generic "great job")
  → Acknowledge hard days ahead (realistic)
  → Avoid: overpromising ("always gets better")
  → Example: "7 days after you couldn't do 1. That's evolution."

FINANCIAL CONTEXT (30%+ of users mention money stress):
  → Acknowledge: broke = real threat (not weakness)
  → Resources: 211 (emergency), food banks, gig apps
  → Separate: money needs ≠ drug needs
  → If craving + broke: sponsor call THEN gig work plan

CRISIS DETECTION (IMMUTABLE):
  Keywords: kill myself, suicide, severe self-harm, end it, overdose
  → "Call 988 now. Real people, 24/7. Go."
  → No negotiation. No therapy talk. Go now.
  → "I'll be here after."

TONE (Learned):
  → Direct, not formal
  → Human, occasional casual OK
  → Non-judgmental (heard it all)
  → Recovery-aware (know neuroscience + 12-step)
  → Action-focused (what to do NOW, not why)

VERSION HISTORY:
  v${newVersion}: Based on ${patternData.total_data_points} interactions + ${insights.length} insights
  Updated: ${new Date().toISOString()}`;

    // Salvar nova versão em Supabase
    const { error: insertError } = await supabase
      .from('miles_versions')
      .insert({
        version_number: newVersion,
        persona: milesV2,
        based_on_interactions: patternData.total_data_points,
        based_on_patterns: patterns,
        deployed: false,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Error inserting MILES version:', insertError);
      process.exit(1);
    }

    // Salvar local TXT
    fs.writeFileSync('miles-latest.txt', milesV2);

    console.log(`✅ MILES v${newVersion} created`);
    console.log(`   Based on: ${patternData.total_data_points} interactions`);
    console.log(`   Insights: ${insights.length}`);
    console.log('\n📄 Saved to miles-latest.txt');
    console.log('📊 Saved to Supabase miles_versions table');
    console.log('\n⚠️  REVIEW miles-latest.txt before deploying!');
    console.log('\n   Once approved, update buildPersonalizedPrompt() to use v${newVersion}');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateMiles().catch(console.error);
