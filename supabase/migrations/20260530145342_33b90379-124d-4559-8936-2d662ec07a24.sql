-- 1. Limpeza total de políticas na tabela profiles
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Limpeza de gatilhos e funções
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- 3. Ajuste na tabela profiles
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'funcionario',
  ALTER COLUMN name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Nova função de criação de perfil (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@gmail.com' THEN 'admin'
      WHEN NEW.email = 'funcionario@gmail.com' THEN 'funcionario'
      ELSE 'funcionario'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Re-criar gatilho no auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Configurar NOVAS políticas limpas
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 7. Limpeza e reconfiguração de inventory_items
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'inventory_items' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inventory_items', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "items_select_policy" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_update_all_policy" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "items_admin_all_policy" ON public.inventory_items FOR ALL TO authenticated 
USING (
  COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'funcionario') = 'admin'
);
