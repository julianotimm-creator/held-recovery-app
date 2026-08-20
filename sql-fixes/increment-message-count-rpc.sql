CREATE OR REPLACE FUNCTION public.increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET message_count = COALESCE(message_count, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT proname, prosqlbody 
FROM pg_proc 
WHERE proname = 'increment_message_count';
