CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select" ON public.community_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_posts_insert_own" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_posts_delete_own" ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX community_posts_created_at_idx ON public.community_posts (created_at DESC);