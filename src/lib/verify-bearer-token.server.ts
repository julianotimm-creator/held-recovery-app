import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Mirrors the token-verification logic in the auto-generated
// requireSupabaseAuth middleware (src/integrations/supabase/auth-middleware.ts).
// Kept separate because that file is regenerated and must not be edited
// directly; this one backs the raw HTTP route in src/routes/api/gauntlet/run.ts,
// which can't use TanStack's createServerFn middleware.

export class UnauthorizedError extends Error {}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/** Verifies a request's `Authorization: Bearer <jwt>` header against Supabase. */
export async function verifyBearerToken(
  request: Request,
): Promise<{ supabase: ReturnType<typeof createClient<Database>>; userId: string }> {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase environment variable(s)");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("No authorization header provided");
  }

  const token = authHeader.slice("Bearer ".length);
  if (!token || token.split(".").length !== 3) {
    throw new UnauthorizedError("Invalid token");
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new UnauthorizedError("Invalid token");
  }

  return { supabase, userId: data.claims.sub };
}
