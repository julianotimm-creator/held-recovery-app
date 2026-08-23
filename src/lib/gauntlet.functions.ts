import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
