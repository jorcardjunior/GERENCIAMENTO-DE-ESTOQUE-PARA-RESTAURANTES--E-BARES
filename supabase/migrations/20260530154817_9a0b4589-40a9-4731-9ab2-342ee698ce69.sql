-- Attach trigger to auth.users (requires superuser or specific setup in Supabase, but typically doable via SQL editor)
-- Note: In Lovable, we usually use the public.profiles table and handle the link via a trigger on auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
