import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSubscriber } from "./community-core.server";

export const HELD_GROUP_ID = 1;

export type CommunityPost = {
  id: string;
  title: string;
  content: string;
  member_id: string;
  created_at: string;
  is_mine: boolean;
};

export type PostComment = {
  id: string;
  content: string;
  member_id: string;
  created_at: string;
  is_mine: boolean;
};

export type PostReactions = {
  counts: Record<string, number>;
  mine: string[];
};

function memberIdFor(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return `Member #${String(hash % 1000).padStart(3, "0")}`;
}

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunityPost[]> => {
    await requireSubscriber(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("community_posts")
      .select("id, user_id, member_id, title, content, created_at")
      .eq("group_conversation_id", HELD_GROUP_ID)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      member_id: p.member_id,
      created_at: p.created_at,
      is_mine: p.user_id === context.userId,
    }));
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string; content: string }) => {
    const title = String(input?.title ?? "")
      .trim()
      .slice(0, 100);
    const content = String(input?.content ?? "")
      .trim()
      .slice(0, 1000);
    if (!title) throw new Error("Título obrigatório");
    if (!content) throw new Error("Conteúdo obrigatório");
    return { title, content };
  })
  .handler(async ({ data, context }) => {
    await requireSubscriber(context.supabase, context.userId);
    const { supabase, userId } = context;
    const memberId = memberIdFor(userId);

    const { error } = await supabase.from("community_posts").insert({
      user_id: userId,
      username: memberId,
      member_id: memberId,
      group_conversation_id: HELD_GROUP_ID,
      title: data.title,
      content: data.content,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    await requireSubscriber(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("community_posts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPostComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string }) => ({ postId: String(input?.postId ?? "") }))
  .handler(async ({ data, context }): Promise<PostComment[]> => {
    await requireSubscriber(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("community_post_comments")
      .select("id, user_id, member_id, content, created_at")
      .eq("post_id", data.postId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return (rows ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      member_id: c.member_id,
      created_at: c.created_at,
      is_mine: c.user_id === context.userId,
    }));
  });

export const createPostComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string; content: string }) => {
    const content = String(input?.content ?? "")
      .trim()
      .slice(0, 1000);
    if (!content) throw new Error("Comentário vazio");
    return { postId: String(input?.postId ?? ""), content };
  })
  .handler(async ({ data, context }) => {
    await requireSubscriber(context.supabase, context.userId);
    const { error } = await context.supabase.from("community_post_comments").insert({
      post_id: data.postId,
      user_id: context.userId,
      member_id: memberIdFor(context.userId),
      content: data.content,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPostReactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string }) => ({ postId: String(input?.postId ?? "") }))
  .handler(async ({ data, context }): Promise<PostReactions> => {
    await requireSubscriber(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("community_post_reactions")
      .select("emoji, user_id")
      .eq("post_id", data.postId);

    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    const mine: string[] = [];
    for (const row of rows ?? []) {
      counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
      if (row.user_id === context.userId) mine.push(row.emoji);
    }
    return { counts, mine };
  });

export const togglePostReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId: string; emoji: string }) => {
    const emoji = String(input?.emoji ?? "");
    if (!["❤️", "👂", "🙏"].includes(emoji)) throw new Error("Reação inválida");
    return { postId: String(input?.postId ?? ""), emoji };
  })
  .handler(async ({ data, context }) => {
    await requireSubscriber(context.supabase, context.userId);
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("community_post_reactions")
      .select("id")
      .eq("post_id", data.postId)
      .eq("user_id", userId)
      .eq("emoji", data.emoji)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("community_post_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { active: false };
    }

    const { error } = await supabase.from("community_post_reactions").insert({
      post_id: data.postId,
      user_id: userId,
      emoji: data.emoji,
    });
    if (error) throw new Error(error.message);
    return { active: true };
  });
