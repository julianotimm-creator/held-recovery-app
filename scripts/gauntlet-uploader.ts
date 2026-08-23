import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hummrtzjlutbmjfxfelm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TestResult {
  scenario_id: string;
  category: string;
  name: string;
  passed: boolean;
  score: number;
  feedback: string[];
  keywords_found: string[];
}

async function uploadToSupabase() {
  console.log("\n📤 Uploading Gauntlet results to Supabase...\n");

  try {
    const resultsPath = path.join(process.cwd(), "gauntlet-results.json");

    if (!fs.existsSync(resultsPath)) {
      console.error("❌ gauntlet-results.json não encontrado. Rode 'npm run gauntlet' primeiro.");
      process.exit(1);
    }

    const results: TestResult[] = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const failed = total - passed;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;

    const categoryScores: Record<string, { passed: number; total: number }> = {
      voice: { passed: 0, total: 0 },
      crisis: { passed: 0, total: 0 },
      conversion: { passed: 0, total: 0 },
      security: { passed: 0, total: 0 },
    };

    results.forEach((r) => {
      const category = r.category as keyof typeof categoryScores;
      if (categoryScores[category]) {
        categoryScores[category].total++;
        if (r.passed) categoryScores[category].passed++;
      }
    });

    const voiceScore = (categoryScores.voice.passed / categoryScores.voice.total) * 100;
    const crisisScore = (categoryScores.crisis.passed / categoryScores.crisis.total) * 100;
    const conversionScore = (categoryScores.conversion.passed / categoryScores.conversion.total) * 100;
    const securityScore = (categoryScores.security.passed / categoryScores.security.total) * 100;

    const runData = {
      run_id: uuidv4(),
      timestamp: new Date().toISOString(),
      total,
      passed,
      failed,
      avg_score: Math.round(avgScore * 10) / 10,
      voice_score: Math.round(voiceScore * 10) / 10,
      crisis_score: Math.round(crisisScore * 10) / 10,
      conversion_score: Math.round(conversionScore * 10) / 10,
      security_score: Math.round(securityScore * 10) / 10,
      results_json: results,
      created_by: "00000000-0000-0000-0000-000000000000",
    };

    const { data, error } = await supabase.from("gauntlet_runs").insert([runData]).select();

    if (error) {
      console.error("❌ Erro ao inserir no Supabase:", error.message);
      process.exit(1);
    }

    console.log("✅ GAUNTLET UPLOAD SUMMARY\n");
    console.log(`Run ID: ${runData.run_id}`);
    console.log(`Timestamp: ${new Date(runData.timestamp).toLocaleString("pt-BR")}`);
    console.log(`\n📊 Results:`);
    console.log(`  Total: ${total}`);
    console.log(`  Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`  Average Score: ${avgScore.toFixed(1)}%`);
    console.log(`\n📈 By Category:`);
    console.log(`  🗣️  Voice:      ${categoryScores.voice.passed}/${categoryScores.voice.total} (${voiceScore.toFixed(1)}%)`);
    console.log(`  🚨 Crisis:      ${categoryScores.crisis.passed}/${categoryScores.crisis.total} (${crisisScore.toFixed(1)}%)`);
    console.log(`  🎯 Conversion:  ${categoryScores.conversion.passed}/${categoryScores.conversion.total} (${conversionScore.toFixed(1)}%)`);
    console.log(`  🔒 Security:    ${categoryScores.security.passed}/${categoryScores.security.total} (${securityScore.toFixed(1)}%)`);
    console.log(`\n✨ Uploaded to Supabase gauntlet_runs table`);
    console.log(`📊 View dashboard: https://always-beside.com/admin/gauntlet-history\n`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  }
}

uploadToSupabase();
