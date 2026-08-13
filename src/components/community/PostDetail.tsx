import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPostComment,
  getPostReactions,
  listPostComments,
  togglePostReaction,
  type CommunityPost,
} from "@/lib/community.functions";

const EMOJIS = ["❤️", "👂", "🙏"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostDetail({
  post,
  onBack,
  onDelete,
}: {
  post: CommunityPost;
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const fetchComments = useServerFn(listPostComments);
  const addComment = useServerFn(createPostComment);
  const fetchReactions = useServerFn(getPostReactions);
  const toggleReaction = useServerFn(togglePostReaction);
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const commentsKey = ["post-comments", post.id];
  const reactionsKey = ["post-reactions", post.id];

  const { data: comments, isLoading } = useQuery({
    queryKey: commentsKey,
    queryFn: () => fetchComments({ data: { postId: post.id } }),
  });

  const { data: reactions } = useQuery({
    queryKey: reactionsKey,
    queryFn: () => fetchReactions({ data: { postId: post.id } }),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_post_comments",
          filter: `post_id=eq.${post.id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_post_reactions",
          filter: `post_id=eq.${post.id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["post-reactions", post.id] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, queryClient]);

  const comment = useMutation({
    mutationFn: (content: string) => addComment({ data: { postId: post.id, content } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentsKey }),
  });

  const react = useMutation({
    mutationFn: (emoji: string) => toggleReaction({ data: { postId: post.id, emoji } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reactionsKey }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || comment.isPending) return;
    setInput("");
    comment.mutate(content);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div className="border-b border-border p-4 md:w-[35%] md:border-b-0 md:border-r md:overflow-y-auto">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </button>

        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{post.title}</h2>
          {post.is_mine && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Apagar tópico"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground">
          {post.member_id} · {formatDate(post.created_at)}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-secondary-foreground">{post.content}</p>

        <div className="mt-4 flex gap-2">
          {EMOJIS.map((emoji) => {
            const active = reactions?.mine.includes(emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => react.mutate(emoji)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {emoji} {reactions?.counts[emoji] ?? 0}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:w-[65%]">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando comentários...</p>}
          {!isLoading && comments?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="rounded-2xl bg-secondary px-4 py-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{c.member_id}</span>
                <span>{formatDate(c.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-secondary-foreground">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={comment.isPending}>
            <Send className="size-4" />
            <span className="sr-only">Comentar</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
