import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  GAUNTLET_SCENARIOS,
  runGauntletScenarios,
  summarizeResults,
} from "../src/lib/gauntlet-core.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runGauntlet() {
  console.log("\n🎯 HELD Gauntlet #1 - Starting 50 Scenarios...\n");
  console.log("=".repeat(60));

  const results = await runGauntletScenarios(GAUNTLET_SCENARIOS);

  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    const status = result.passed ? "PASS" : "FAIL";
    console.log(
      `${icon} ${result.scenario_id} (${result.category.toUpperCase()}) [${status}] ${result.score.toFixed(1)}%`,
    );
  }

  const summary = summarizeResults(results);

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 GAUNTLET RESULTS\n");
  console.log(`Total Scenarios: ${summary.total}`);
  console.log(
    `Passed: ${summary.passed}/${summary.total} (${((summary.passed / summary.total) * 100).toFixed(1)}%)`,
  );
  console.log(`Average Score: ${summary.avgScore.toFixed(1)}%`);

  console.log("\n📈 By Category:");
  console.log(`  🗣️  VOICE (Pattern Recognition): ${summary.voiceScore.toFixed(1)}%`);
  console.log(`  🚨 CRISIS (Safety): ${summary.crisisScore.toFixed(1)}%`);
  console.log(`  🎯 CONVERSION (Engagement): ${summary.conversionScore.toFixed(1)}%`);
  console.log(`  🔒 SECURITY (Boundaries): ${summary.securityScore.toFixed(1)}%`);

  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0 && failures.length <= 10) {
    console.log("\n⚠️  TOP FAILURES TO FIX:\n");
    failures.slice(0, 5).forEach((f) => {
      console.log(`${f.scenario_id} - ${f.name}`);
      f.feedback.forEach((msg) => console.log(`  → ${msg}`));
    });
  }

  const resultsPath = path.join(__dirname, "../gauntlet-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  console.log(`\n💾 Full results saved to: ./gauntlet-results.json`);
  console.log("\n✨ Gauntlet complete!\n");

  process.exit(summary.passed >= 35 ? 0 : 1);
}

runGauntlet().catch((err) => {
  console.error("Gauntlet error:", err);
  process.exit(1);
});
