-- ========== CRIAR TABELA gauntlet_runs + RLS ==========
-- Cole isso no SQL Editor do Supabase e execute

CREATE TABLE IF NOT EXISTS public.gauntlet_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  avg_score NUMERIC NOT NULL,
  voice_score NUMERIC,
  crisis_score NUMERIC,
  conversion_score NUMERIC,
  security_score NUMERIC,
  results_json JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gauntlet_runs ENABLE ROW LEVEL SECURITY;

-- Somente admins (via user_roles) podem LER o histórico pelo dashboard.
-- Não há política de INSERT/UPDATE/DELETE: só a service_role (usada pelo
-- script scripts/gauntlet-uploader.ts) pode escrever, pois ela ignora RLS.
CREATE POLICY "Admins can view gauntlet runs"
  ON public.gauntlet_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- ========== VERIFICAR SE FOI CRIADO ==========
SELECT table_name FROM information_schema.tables WHERE table_name = 'gauntlet_runs';
