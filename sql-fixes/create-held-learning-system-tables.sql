-- ========== HELD Learning System: user_conversations, user_profiles, ==========
-- ========== pattern_discoveries, miles_versions + RLS               ==========
-- Cole isso no SQL Editor do Supabase e execute

CREATE TABLE IF NOT EXISTS public.user_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT NOT NULL,
  user_message TEXT NOT NULL,
  claude_response TEXT NOT NULL,
  response_length INTEGER,
  pattern TEXT,
  financial_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_conversations_user_hash_idx
  ON public.user_conversations (user_hash);
CREATE INDEX IF NOT EXISTS user_conversations_created_at_idx
  ON public.user_conversations (created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT NOT NULL UNIQUE,
  recovery_category TEXT,
  best_technique TEXT,
  technique_success_rate NUMERIC,
  common_triggers TEXT[],
  interaction_count INTEGER,
  relapse_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pattern_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timestamp" TIMESTAMPTZ NOT NULL,
  total_data_points INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  patterns JSONB NOT NULL,
  recommendations JSONB,
  insights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.miles_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INTEGER NOT NULL,
  persona TEXT NOT NULL,
  based_on_interactions INTEGER,
  based_on_patterns JSONB,
  deployed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miles_versions ENABLE ROW LEVEL SECURITY;

-- All four tables are only ever read/written server-side through the service
-- role (src/lib/*.server.ts and scripts/*.ts), which bypasses RLS. RLS is
-- enabled as a default-deny baseline; no policies are defined, so anon/
-- authenticated clients get nothing directly.

-- ========== VERIFICAR SE FOI CRIADO ==========
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user_conversations', 'user_profiles', 'pattern_discoveries', 'miles_versions');
