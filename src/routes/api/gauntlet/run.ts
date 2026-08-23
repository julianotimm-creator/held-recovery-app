import { createFileRoute } from "@tanstack/react-router";
import { NOT_ADMIN } from "@/lib/admin-core.server";
import { RATE_LIMITED_PREFIX, executeGauntletRun } from "@/lib/gauntlet.functions";
import { UnauthorizedError, verifyBearerToken } from "@/lib/verify-bearer-token.server";

export const Route = createFileRoute("/api/gauntlet/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let supabase;
        let userId: string;

        try {
          ({ supabase, userId } = await verifyBearerToken(request));
        } catch (err) {
          if (err instanceof UnauthorizedError) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          console.error("[gauntlet-run] auth error", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }

        try {
          const { requireAdmin } = await import("@/lib/admin-core.server");
          await requireAdmin(supabase, userId);
        } catch (err) {
          if (err instanceof Error && err.message === NOT_ADMIN) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          console.error("[gauntlet-run] admin check error", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const result = await executeGauntletRun(supabaseAdmin, userId, "dashboard");
          return Response.json(result, { status: 200 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.startsWith(RATE_LIMITED_PREFIX)) {
            const minutesLeft = message.slice(RATE_LIMITED_PREFIX.length);
            return Response.json(
              { error: `Espere ${minutesLeft} minuto(s) antes de rodar de novo.` },
              { status: 429 },
            );
          }
          console.error("[gauntlet-run] execution error", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
