import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const NOT_ADMIN = "NOT_ADMIN";
export const MONTHLY_PRICE = 99.99;
export const PAGE_SIZE = 20;

/** Throws unless the signed-in user has the admin role. */
export async function requireAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error(NOT_ADMIN);
}

export type AdminRow = {
  id: string;
  email: string;
  messageCount: number;
  createdAt: string;
  paidAt: string | null;
};

export type AdminOverview = {
  totalUsers: number;
  payingUsers: number;
  mrr: number;
  churnRate: number;
  activeToday: number;
};

type Admin = SupabaseClient<Database>;

/** Maps user ids to auth emails (admin API, paged). */
export async function emailMap(admin: Admin, ids: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (ids.length === 0) return map;
  const wanted = new Set(ids);
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const u of data.users) {
      if (wanted.has(u.id)) map[u.id] = u.email ?? "—";
    }
    if (data.users.length < 200) break;
  }
  return map;
}
