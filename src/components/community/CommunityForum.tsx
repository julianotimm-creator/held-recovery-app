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
        Loading...
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
          <h2 className="text-base font-semibold text-foreground">Members-only access.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Subscribe now for $69.99/month</p>
        </div>
        <Link
          to="/checkout"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Subscribe now
        </Link>
        <p className="text-[11px] text-muted-foreground">
          Only subscribers can view topics, post, and comment.
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
          <p className="text-[11px] text-muted-foreground">Everything here is anonymous.</p>
        </div>
        <Button size="sm" className="rounded-full" onClick={() => setShowModal(true)}>
          <Plus className="size-4" /> New Topic
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading community...</p>}
        {!isLoading && posts?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No one has started a topic yet. Be the first.
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
