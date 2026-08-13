ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Sem título',
  ADD COLUMN IF NOT EXISTS group_conversation_id integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS member_id text NOT NULL DEFAULT 'Member #000';

UPDATE public.community_posts SET member_id = username WHERE member_id = 'Member #000';

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.community_post_comments TO authenticated;
GRANT ALL ON public.community_post_comments TO service_role;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON public.community_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.community_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.community_post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('❤️','👂','🙏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

GRANT SELECT, INSERT, DELETE ON public.community_post_reactions TO authenticated;
GRANT ALL ON public.community_post_reactions TO service_role;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON public.community_post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON public.community_post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON public.community_post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.community_post_reactions(post_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_reactions;