import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminOverview, AdminRow } from "./admin-core.server";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { requireAdmin, MONTHLY_PRICE } = await import("./admin-core.server");
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const total = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
    const paying = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_paid", true);
    const churned = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_paid", false)
      .not("paid_at", "is", null);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const active = await supabaseAdmin
      .from("messages")
      .select("user_id")
      .gte("created_at", since);
    const activeToday = new Set((active.data ?? []).map((m) => m.user_id)).size;

    const payingUsers = paying.count ?? 0;
    const churnedCount = churned.count ?? 0;
    const base = payingUsers + churnedCount;

    return {
      totalUsers: total.count ?? 0,
      payingUsers,
      mrr: payingUsers * MONTHLY_PRICE,
      churnRate: base > 0 ? (churnedCount / base) * 100 : 0,
      activeToday,
    };
  });

export const getAbandonedUsers = createServerFn({ method: "GET" })
  .inputValidator((input: { page?: number }) => ({ page: Math.max(1, Number(input?.page ?? 1)) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ rows: AdminRow[]; total: number }> => {
    const { requireAdmin, emailMap, PAGE_SIZE } = await import("./admin-core.server");
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const from = (data.page - 1) * PAGE_SIZE;
    const { data: rows, count } = await supabaseAdmin
      .from("users")
      .select("id, message_count, created_at, paid_at", { count: "exact" })
      .gte("message_count", 10)
      .eq("is_paid", false)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const list = rows ?? [];
    const emails = await emailMap(supabaseAdmin, list.map((r) => r.id));

    return {
      total: count ?? 0,
      rows: list.map((r) => ({
        id: r.id,
        email: emails[r.id] ?? "—",
        messageCount: r.message_count,
        createdAt: r.created_at,
        paidAt: r.paid_at,
      })),
    };
  });

export const getPayingSubscribers = createServerFn({ method: "GET" })
  .inputValidator((input: { page?: number }) => ({ page: Math.max(1, Number(input?.page ?? 1)) }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ rows: AdminRow[]; total: number }> => {
    const { requireAdmin, emailMap, PAGE_SIZE } = await import("./admin-core.server");
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const from = (data.page - 1) * PAGE_SIZE;
    const { data: rows, count } = await supabaseAdmin
      .from("users")
      .select("id, message_count, created_at, paid_at", { count: "exact" })
      .eq("is_paid", true)
      .order("paid_at", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1);

    const list = rows ?? [];
    const emails = await emailMap(supabaseAdmin, list.map((r) => r.id));

    return {
      total: count ?? 0,
      rows: list.map((r) => ({
        id: r.id,
        email: emails[r.id] ?? "—",
        messageCount: r.message_count,
        createdAt: r.created_at,
        paidAt: r.paid_at,
      })),
    };
  });
