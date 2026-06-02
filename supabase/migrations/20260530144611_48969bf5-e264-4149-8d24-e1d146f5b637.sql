-- Remover políticas antigas que podem estar bloqueando o cadastro
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar novas políticas permitindo inserção por usuários autenticados (necessário para o signUp criar o perfil)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Garantir que a tabela inventory_items também permita inserção por admin
DROP POLICY IF EXISTS "Admins can manage items" ON public.inventory_items;
CREATE POLICY "Admins can manage items" 
ON public.inventory_items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
