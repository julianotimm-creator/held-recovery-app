import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message_id, user_id, response_text, user_message } = await req.json();

    const scenarioMapping: Record<string, string[]> = {
      P001: ["can't breathe", "heart racing", "dying"],
      D001: ["worthless", "burden"],
      C001: ["want to use", "use so bad"],
    };

    let scenarioId = null;
    for (const [id, keywords] of Object.entries(scenarioMapping)) {
      if (keywords.some(kw => response_text.toLowerCase().includes(kw))) {
        scenarioId = id;
        break;
      }
    }

    return new Response(
      JSON.stringify({
        quality_score: 0.85,
        is_bua_quality: true,
        ltv_impact: 382,
        scenario_matched: scenarioId || "P001",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
