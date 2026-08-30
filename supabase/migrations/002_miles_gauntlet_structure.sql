-- ========================================
-- MILES GAUNTLET: 50 Scenario Training
-- ========================================

CREATE TABLE IF NOT EXISTS public.miles_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id VARCHAR(10) NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('panic', 'depression', 'cravings', 'isolation', 'progress')),
  scenario_name VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  bua_response TEXT NOT NULL,
  ra_response TEXT NOT NULL,
  bua_retention_impact DECIMAL(5, 2),
  bua_ltv_impact INTEGER,
  ra_churn_impact DECIMAL(5, 2),
  ra_ltv_impact INTEGER,
  criteria JSONB NOT NULL,
  system_prompt_override TEXT,
  version_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.response_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  miles_version_id UUID NOT NULL REFERENCES public.miles_versions(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  quality_score DECIMAL(3, 2),
  is_bua_quality BOOLEAN,
  criteria_match JSONB,
  scoring_notes TEXT,
  ltv_impact INTEGER,
  retention_impact DECIMAL(5, 2),
  reviewed_by_human BOOLEAN DEFAULT false,
  human_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ltv_impact_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  miles_version_id UUID REFERENCES public.miles_versions(id),
  ltv_baseline INTEGER DEFAULT 1200,
  ltv_impact INTEGER,
  ltv_current INTEGER,
  is_paid BOOLEAN,
  subscription_status VARCHAR(20),
  days_retained INTEGER,
  churn_risk_score DECIMAL(3, 2),
  predicted_retention_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_miles_scenario_id ON public.miles_versions(scenario_id);
CREATE INDEX idx_quality_miles_version ON public.response_quality_scores(miles_version_id);
CREATE INDEX idx_ltv_user ON public.ltv_impact_tracking(user_id);
