-- ========== ADICIONAR AUDITORIA (quem rodou, de onde) EM gauntlet_runs ==========
-- Cole isso no SQL Editor do Supabase e execute
-- Pré-requisito: sql-fixes/create-gauntlet-runs-table.sql já executado

ALTER TABLE public.gauntlet_runs
  ADD COLUMN IF NOT EXISTS trigger_source TEXT NOT NULL DEFAULT 'cli';

COMMENT ON COLUMN public.gauntlet_runs.trigger_source IS
  'Origem da execução: cli (npm run gauntlet) ou dashboard (botão em /admin/gauntlet-history)';
COMMENT ON COLUMN public.gauntlet_runs.created_by IS
  'user_id do admin que disparou a execução (null quando trigger_source = cli)';

-- ========== VERIFICAR ==========
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'gauntlet_runs' AND column_name = 'trigger_source';
