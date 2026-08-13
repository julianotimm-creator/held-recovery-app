-- Migration: Add Discord and Webhook columns to users table
-- Purpose: Store Discord invite info and track subscription status

-- 1. Adicionar coluna de URL de convite Discord
ALTER TABLE users
ADD COLUMN IF NOT EXISTS discord_invite_url TEXT;

-- 2. Adicionar timestamp de quando o convite foi enviado
ALTER TABLE users
ADD COLUMN IF NOT EXISTS discord_invited_at TIMESTAMP WITH TIME ZONE;

-- 3. Adicionar coluna para guardar status da subscription
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'inactive'));

-- 4. Adicionar coluna para data de término da subscription
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- 5. Criar índice para queries rápidas de subscribers ativos
CREATE INDEX IF NOT EXISTS idx_users_subscription_active
ON users(subscription_active, subscription_status);

-- 6. Criar índice para queries de customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id);

-- Comentários úteis
COMMENT ON COLUMN users.discord_invite_url IS 'URL do convite único para o Discord (válido por 24h)';
COMMENT ON COLUMN users.discord_invited_at IS 'Timestamp de quando o convite foi criado/enviado';
COMMENT ON COLUMN users.subscription_status IS 'Status atual da subscription: active, trialing, past_due, canceled, unpaid, inactive';
COMMENT ON COLUMN users.subscription_end_date IS 'Data de término do período de pagamento atual';
