// scripts/discover-patterns.ts
// Analisa dados de outcomes, descobre padrões
// Roda: npx tsx scripts/discover-patterns.ts
// Frequência: 2x/week (segunda e quinta)

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function discoverPatterns() {
  console.log('📊 Discovering patterns from user interactions...\n');

  try {
    // Buscar últimas 200 interações
    const { data: interactions, error: fetchError } = await supabase
      .from('user_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (fetchError || !interactions?.length) {
      console.log('⚠️ Not enough data yet (need 20+ interactions)');
      process.exit(0);
    }

    console.log(`📈 Analyzing ${interactions.length} interactions...\n`);

    // Agrupar por padrão
    const byPattern: { [key: string]: any[] } = {};
    interactions.forEach(i => {
      if (!byPattern[i.pattern]) {
        byPattern[i.pattern] = [];
      }
      byPattern[i.pattern].push(i);
    });

    // Análise
    const analysis: { [key: string]: any } = {};
    Object.entries(byPattern).forEach(([pattern, data]) => {
      const avgLength = data.reduce((sum, d) => sum + (d.response_length || 0), 0) / data.length;

      analysis[pattern] = {
        total_interactions: data.length,
        avg_response_length: Math.round(avgLength),
        percentage: ((data.length / interactions.length) * 100).toFixed(1),
        financial_context_breakdown: {
          broke: data.filter(d => d.financial_context === 'broke').length,
          employed: data.filter(d => d.financial_context === 'employed').length,
          stable: data.filter(d => d.financial_context === 'stable').length,
          unknown: data.filter(d => d.financial_context === 'unknown').length
        }
      };
    });

    console.log('📋 Pattern Distribution:');
    Object.entries(analysis).forEach(([pattern, stats]: any) => {
      console.log(
        `  ${pattern}: ${stats.total_interactions} interactions (${stats.percentage}%)`
      );
      console.log(
        `    Avg response: ${stats.avg_response_length} chars`
      );
      console.log(
        `    Financial: broke ${stats.financial_context_breakdown.broke}, employed ${stats.financial_context_breakdown.employed}, stable ${stats.financial_context_breakdown.stable}`
      );
    });

    // Gerar recommendations
    const recommendations: string[] = [];
    Object.entries(analysis).forEach(([pattern, stats]: any) => {
      if (stats.avg_response_length < 80) {
        recommendations.push(
          `${pattern} responses too short (${stats.avg_response_length} chars) — add more detail`
        );
      }
      if (stats.avg_response_length > 600) {
        recommendations.push(
          `${pattern} responses too long (${stats.avg_response_length} chars) — be more concise`
        );
      }

      if (stats.financial_context_breakdown.broke > stats.total_interactions * 0.3) {
        recommendations.push(
          `${pattern}: ${stats.financial_context_breakdown.broke} users broke (30%+) — emphasize financial resources`
        );
      }
    });

    // Salvar discovery
    const discovery = {
      timestamp: new Date().toISOString(),
      total_data_points: interactions.length,
      version_number: Math.floor(Date.now() / 1000 / 86400), // Day-based version
      patterns: analysis,
      recommendations: recommendations,
      insights: generateInsights(analysis)
    };

    const { error: insertError } = await supabase
      .from('pattern_discoveries')
      .insert(discovery);

    if (insertError) {
      console.error('❌ Error inserting pattern discovery:', insertError);
    } else {
      console.log('✅ Pattern discovery saved to Supabase');
    }

    // Salvar local JSON
    fs.writeFileSync(
      'discovery-latest.json',
      JSON.stringify(discovery, null, 2)
    );
    console.log('✅ Saved to discovery-latest.json\n');

    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(r => console.log(`  - ${r}`));
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

function generateInsights(analysis: any): string[] {
  const insights: string[] = [];

  // Padrões mais comuns
  const mostCommon = Object.entries(analysis)
    .sort((a: any, b: any) => b[1].total_interactions - a[1].total_interactions)[0];

  if (mostCommon) {
    insights.push(`Most common pattern: ${mostCommon[0]} (${(mostCommon[1] as any).percentage}% of interactions)`);
  }

  // Padrões com stress financeiro
  Object.entries(analysis).forEach(([pattern, stats]: any) => {
    const brokePercent = (stats.financial_context_breakdown.broke / stats.total_interactions) * 100;
    if (brokePercent > 25) {
      insights.push(
        `${pattern} users: ${brokePercent.toFixed(0)}% mention financial stress`
      );
    }
  });

  return insights;
}

discoverPatterns().catch(console.error);
