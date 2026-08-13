import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostList } from "./PostList";
import { PostDetail } from "./PostDetail";
import { CreatePostModal } from "./CreatePostModal";
import {
  createCommunityPost,
  deleteCommunityPost,
  listCommunityPosts,
  HELD_GROUP_ID,
  type CommunityPost,
} from "@/lib/community.functions";
import { useSubscription } from "@/hooks/use-subscription";

export function CommunityForum() {
  const fetchPosts = useServerFn(listCommunityPosts);
  const createPost = useServerFn(createCommunityPost);
  const removePost = useServerFn(deleteCommunityPost);
  const queryClient = useQueryClient();

  const [groupId] = useState(HELD_GROUP_ID);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: chatState, isLoading: stateLoading } = useSubscription();
  const isSubscriber = chatState?.isPaid === true;

  const { data: posts, isLoading } = useQuery({
    queryKey: ["community-posts", groupId],
    queryFn: () => fetchPosts(),
    enabled: isSubscriber,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["community-posts"] });

  const create = useMutation({
    mutationFn: (values: { title: string; content: string }) => createPost({ data: values }),
    onSuccess: () => {
      setShowModal(false);
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removePost({ data: { id } }),
    onSuccess: () => {
      setSelectedPost(null);
      invalidate();
    },
  });

  if (stateLoading) {
    return (
      <div className="surface-panel flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isSubscriber) {
    return (
      <div className="surface-panel flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Acesso exclusivo para membros.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Assine agora por $99.99/mês</p>
        </div>
        <Link
          to="/checkout"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Assinar agora
        </Link>
        <p className="text-[11px] text-muted-foreground">
          Somente assinantes podem ver tópicos, publicar e comentar.
        </p>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="surface-panel flex flex-1 flex-col overflow-hidden">
        <PostDetail
          post={selectedPost}
          onBack={() => setSelectedPost(null)}
          onDelete={(id) => remove.mutate(id)}
        />
      </div>
    );
  }

  return (
    <div className="surface-panel flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">HELD Community</h2>
          <p className="text-[11px] text-muted-foreground">Tudo aqui é anônimo.</p>
        </div>
        <Button size="sm" className="rounded-full" onClick={() => setShowModal(true)}>
          <Plus className="size-4" /> Novo Tópico
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando mural...</p>}
        {!isLoading && posts?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ninguém abriu um tópico ainda. Seja o primeiro.
          </p>
        )}
        {posts && posts.length > 0 && <PostList posts={posts} onSelect={setSelectedPost} />}
      </div>

      {error && <p className="p-2 text-center text-xs text-destructive">{error}</p>}

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreate={(values) => create.mutate(values)}
          isPending={create.isPending}
        />
      )}
    </div>
  );
}
