-- Função para atribuir role automática
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@gmail.com' THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  ELSIF NEW.email = 'funcionario@gmail.com' THEN
    UPDATE public.profiles SET role = 'funcionario' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger no auth.users (necessário permissão ou usar trigger no public.profiles)
-- Como não podemos mexer no schema auth diretamente com facilidade, vamos usar no public.profiles
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
CREATE TRIGGER on_profile_created_assign_role
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
