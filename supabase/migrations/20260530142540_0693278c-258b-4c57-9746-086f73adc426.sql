-- Adicionar coluna section em inventory_items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS section TEXT;

-- Garantir que a role seja válida
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Omitido para usar texto simples por flexibilidade
    END IF;
END $$;

-- Atualizar políticas de RLS para inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own items" ON public.inventory_items;
CREATE POLICY "Users can view items" 
ON public.inventory_items FOR SELECT 
USING (true); -- Permitir que todos autenticados vejam (ou ajustar conforme necessidade)

DROP POLICY IF EXISTS "Admins can do everything" ON public.inventory_items;
CREATE POLICY "Admins can do everything" 
ON public.inventory_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Employees can update stock" ON public.inventory_items;
CREATE POLICY "Employees can update stock" 
ON public.inventory_items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'employee')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'employee')
  )
);

-- Políticas para Categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Políticas para Movimentações
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view movements" ON public.stock_movements;
CREATE POLICY "Everyone can view movements" ON public.stock_movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can create movements" ON public.stock_movements;
CREATE POLICY "Everyone can create movements" ON public.stock_movements FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions (necessário no public schema para PostgREST)
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.stock_movements TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
