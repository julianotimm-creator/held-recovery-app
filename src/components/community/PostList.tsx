import type { CommunityPost } from "@/lib/community.functions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostList({
  posts,
  onSelect,
}: {
  posts: CommunityPost[];
  onSelect: (post: CommunityPost) => void;
}) {
  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li key={post.id}>
          <button
            type="button"
            onClick={() => onSelect(post)}
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-left transition-colors hover:bg-accent"
          >
            <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {post.content.length > 150 ? `${post.content.slice(0, 150)}...` : post.content}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{post.member_id}</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
