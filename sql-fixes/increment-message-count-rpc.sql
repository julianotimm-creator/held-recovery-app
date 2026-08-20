-- ========== CRIAR RPC FUNCTION PARA INCREMENTAR MESSAGE_COUNT ==========
-- Cole isso no SQL Editor do Supabase e execute

CREATE OR REPLACE FUNCTION public.increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET message_count = COALESCE(message_count, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== VERIFICAR SE FOI CRIADO ==========
SELECT proname, prosqlbody 
FROM pg_proc 
WHERE proname = 'increment_message_count';

-- Se retornar uma linha, está pronto!
