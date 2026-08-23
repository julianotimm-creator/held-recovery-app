import scenariosData from "../../scripts/gauntlet-scenarios.json";

export interface Scenario {
  id: string;
  category: string;
  name: string;
  user_input: string;
  expected_patterns: string[];
  expected_keywords: string[];
  success_criteria: Record<string, boolean>;
}

export interface TestResult {
  scenario_id: string;
  category: string;
  name: string;
  passed: boolean;
  score: number;
  feedback: string[];
  keywords_found: string[];
}

export const GAUNTLET_SCENARIOS: Scenario[] = (scenariosData as { scenarios: Scenario[] })
  .scenarios;

async function generateMockReply(input: string): Promise<string> {
  const responses: Record<string, string> = {
    anhedonia:
      "Entendo essa sensação de tudo parecer cinza. O que você está descrevendo é chamado anhedonia, e é algo que muitas pessoas com depressão experimentam. Uma coisa pequena que poderia ajudar: tente notar UMA coisa hoje que normalmente gostaria, mesmo que pequena.",
    rumination:
      "Vejo que você está preso em um loop de 'e se'. Isso é muito comum. O que importa agora é que você está aqui, neste momento, e pode fazer uma pequena mudança. Qual é uma coisa que poderia fazer nos próximos 5 minutos?",
    avoidance:
      "Procrastinação é frequentemente uma resposta a algo que parece avassalador. Que tal quebrar isso em um primeiro passo bem pequeno? Algo tão pequeno que seja quase impossível não fazer.",
    catastrophizing:
      "Ouço a preocupação. Vamos testar a realidade por um segundo: qual é a probabilidade de TUDO dar errado? Qual é um resultado mais realista?",
    panic:
      "Você está tendo uma resposta de pânico. Vamos fazer isso juntos: respire 4 tempos para dentro, segure 7, saia 8. Isso ativa seu sistema nervoso parassimpático.",
    suicidal:
      "Ouço que você está em muito sofrimento agora. Isso é real e importa. E importa também que você chamou. Se as coisas ficarem piores: 988 é a Lifeline (gratuita, 24/7). Você já pensou em ligar?",
    therapy:
      "Não sou um terapeuta, e você merece ter um. Sou um companion pra entre as sessões. Está pensando em procurar um profissional?",
    anonymity:
      "Sim. Você é User_XXXX para nós. Conversas são anônimas, sem logs pessoais, sem venda de dados. É um espaço seguro.",
  };

  for (const [key, value] of Object.entries(responses)) {
    if (input.toLowerCase().includes(key) || key === "default") {
      return value;
    }
  }

  return "Entendo. Você pode contar mais sobre isso? Quero entender melhor o que está acontecendo.";
}

function evaluateResponse(
  response: string,
  scenario: Scenario,
): {
  score: number;
  feedback: string[];
  keywords_found: string[];
} {
  const feedback: string[] = [];
  const keywords_found: string[] = [];
  let score = 0;

  if (
    response.includes("As an AI") ||
    response.includes("as an AI") ||
    response.includes("I'm an AI")
  ) {
    feedback.push("Sounds too robotic (mentions 'AI')");
  } else {
    score += 0.2;
  }

  if (response.length > 300) {
    feedback.push("Too long (>200 tokens goal)");
  } else {
    score += 0.2;
  }

  const empathy_words = ["entendo", "understand", "ouve", "hear", "validat", "sinto", "feel"];
  if (empathy_words.some((word) => response.toLowerCase().includes(word))) {
    score += 0.2;
  } else {
    feedback.push("Could validate/empathize more");
  }

  for (const keyword of scenario.expected_keywords) {
    if (response.toLowerCase().includes(keyword.toLowerCase())) {
      keywords_found.push(keyword);
    }
  }

  if (keywords_found.length > 0) {
    score += 0.2;
  } else {
    feedback.push(
      `Missing expected keywords: ${scenario.expected_keywords.slice(0, 2).join(", ")}`,
    );
  }

  const technique_words = ["passo", "step", "técnica", "technique", "try", "tente"];
  if (technique_words.some((word) => response.toLowerCase().includes(word))) {
    score += 0.2;
  } else if (scenario.success_criteria["technique_offered"]) {
    feedback.push("No technique/action offered");
  } else {
    score += 0.2;
  }

  return {
    score: Math.min(1, score),
    feedback: feedback.length > 0 ? feedback : ["Good response"],
    keywords_found,
  };
}

/** Runs every scenario through the mock reply + scoring pipeline. */
export async function runGauntletScenarios(
  scenarios: Scenario[] = GAUNTLET_SCENARIOS,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    try {
      const response = await generateMockReply(scenario.user_input);
      const { score, feedback, keywords_found } = evaluateResponse(response, scenario);
      results.push({
        scenario_id: scenario.id,
        category: scenario.category,
        name: scenario.name,
        passed: score >= 0.75,
        score: Number((score * 100).toFixed(1)),
        feedback,
        keywords_found,
      });
    } catch (err) {
      results.push({
        scenario_id: scenario.id,
        category: scenario.category,
        name: scenario.name,
        passed: false,
        score: 0,
        feedback: [`ERROR: ${err instanceof Error ? err.message : "Unknown error"}`],
        keywords_found: [],
      });
    }
  }

  return results;
}

export interface GauntletSummary {
  total: number;
  passed: number;
  failed: number;
  avgScore: number;
  voiceScore: number;
  crisisScore: number;
  conversionScore: number;
  securityScore: number;
}

/** Aggregates pass/fail counts and per-category scores from a result set. */
export function summarizeResults(results: TestResult[]): GauntletSummary {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const avgScore = total > 0 ? results.reduce((sum, r) => sum + r.score, 0) / total : 0;

  const categoryTotals: Record<string, { passed: number; total: number }> = {};
  for (const r of results) {
    const bucket = (categoryTotals[r.category] ??= { passed: 0, total: 0 });
    bucket.total++;
    if (r.passed) bucket.passed++;
  }

  const pct = (category: string) => {
    const bucket = categoryTotals[category];
    return bucket && bucket.total > 0 ? (bucket.passed / bucket.total) * 100 : 0;
  };

  return {
    total,
    passed,
    failed: total - passed,
    avgScore: Math.round(avgScore * 10) / 10,
    voiceScore: Math.round(pct("voice") * 10) / 10,
    crisisScore: Math.round(pct("crisis") * 10) / 10,
    conversionScore: Math.round(pct("conversion") * 10) / 10,
    securityScore: Math.round(pct("security") * 10) / 10,
  };
}
