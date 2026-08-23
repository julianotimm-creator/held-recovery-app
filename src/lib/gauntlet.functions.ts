import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RATE_LIMIT_MINUTES = 60;
/** Prefix on the thrown error message when a run is rejected by the rate limit. */
export const RATE_LIMITED_PREFIX = "RATE_LIMITED:";

export type GauntletRun = {
  id: string;
  run_id: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  avg_score: number;
  voice_score: number | null;
  crisis_score: number | null;
  conversion_score: number | null;
  security_score: number | null;
  results_json: Array<{
    scenario_id: string;
    category: string;
    name: string;
    passed: boolean;
    score: number;
    feedback: string[];
    keywords_found: string[];
  }>;
};

export const getGauntletRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GauntletRun[]> => {
    const { requireAdmin } = await import("./admin-core.server");
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // `gauntlet_runs` isn't in the generated Database type yet (types.ts is
    // regenerated from the schema); cast until that sync picks up the table.
    const { data, error } = await supabaseAdmin
      .from("gauntlet_runs" as any)
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as GauntletRun[];
  });

export type GauntletRunResult = {
  passed: number;
  failed: number;
  avg_score: number;
  timestamp: string;
  results: GauntletRun["results_json"];
};

/**
 * Runs the 50-scenario Gauntlet suite on demand from the admin dashboard.
 * Admin-only, and rate-limited to one run per hour (checked against the most
 * recent row in `gauntlet_runs`, regardless of who/what triggered it).
 */
export const runGauntletNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GauntletRunResult> => {
    const { requireAdmin } = await import("./admin-core.server");
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { v4: uuidv4 } = await import("uuid");
    const { runGauntletScenarios, summarizeResults, GAUNTLET_SCENARIOS } = await import(
      "./gauntlet-core"
    );

    const { data: lastRun } = await supabaseAdmin
      .from("gauntlet_runs" as any)
      .select("timestamp")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRun && "timestamp" in lastRun) {
      const elapsedMinutes = (Date.now() - new Date(lastRun.timestamp as string).getTime()) / 60_000;
      if (elapsedMinutes < RATE_LIMIT_MINUTES) {
        const minutesLeft = Math.ceil(RATE_LIMIT_MINUTES - elapsedMinutes);
        throw new Error(`${RATE_LIMITED_PREFIX}${minutesLeft}`);
      }
    }

    console.log(
      `[gauntlet] run triggered by user ${context.userId} at ${new Date().toISOString()}`,
    );

    const results = await runGauntletScenarios(GAUNTLET_SCENARIOS);
    const summary = summarizeResults(results);
    const timestamp = new Date().toISOString();

    const { error } = await supabaseAdmin.from("gauntlet_runs" as any).insert([
      {
        run_id: uuidv4(),
        timestamp,
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        avg_score: summary.avgScore,
        voice_score: summary.voiceScore,
        crisis_score: summary.crisisScore,
        conversion_score: summary.conversionScore,
        security_score: summary.securityScore,
        results_json: results,
        created_by: context.userId,
        trigger_source: "dashboard",
      },
    ]);

    if (error) throw new Error(error.message);

    return {
      passed: summary.passed,
      failed: summary.failed,
      avg_score: summary.avgScore,
      timestamp,
      results,
    };
  });
