import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export const SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED";

/** Throws when the current user is not an active subscriber. */
export async function requireSubscriber(supabase: Client, userId: string): Promise<void> {
  const { data } = await supabase
    .from("public.users")
    .select("subscription_active")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.subscription_active) throw new Error(SUBSCRIPTION_REQUIRED);
}
