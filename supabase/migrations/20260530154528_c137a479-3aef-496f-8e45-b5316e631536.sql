-- 0. FIX EXISTING TABLE CONSTRAINTS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='user_id') THEN
        ALTER TABLE public.categories ALTER COLUMN user_id DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='user_id') THEN
        ALTER TABLE public.inventory_items ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- 1. TABLES DEFINITION
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    unit_default TEXT NOT NULL,
    synonyms TEXT,
    track_expiry BOOLEAN DEFAULT false,
    yellow_threshold NUMERIC DEFAULT 3,
    red_threshold NUMERIC DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT catalog_items_name_category_id_key UNIQUE (name, category_id)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'inventory_items') THEN
        CREATE TABLE public.inventory_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id),
            current_stock NUMERIC DEFAULT 0,
            reorder_point NUMERIC DEFAULT 5,
            yellow_threshold NUMERIC DEFAULT 3,
            red_threshold NUMERIC DEFAULT 1,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.catalog_items(id);
        ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS reorder_point NUMERIC DEFAULT 5;
        ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS yellow_threshold NUMERIC DEFAULT 3;
        ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS red_threshold NUMERIC DEFAULT 1;
        ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.item_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_code TEXT,
    qty_current NUMERIC NOT NULL DEFAULT 0,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'stock_movements') THEN
        CREATE TABLE public.stock_movements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inventory_item_id UUID REFERENCES public.inventory_items(id),
            batch_id UUID REFERENCES public.item_batches(id),
            type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'LOSS', 'ADJUST')),
            qty NUMERIC NOT NULL,
            reason TEXT,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='item_id') THEN
            ALTER TABLE public.stock_movements RENAME COLUMN item_id TO inventory_item_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='quantity') THEN
            ALTER TABLE public.stock_movements RENAME COLUMN quantity TO qty;
        END IF;
        ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.item_batches(id);
        ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. POLICIES & RLS
DO $$ 
BEGIN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_batches ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
    DROP POLICY IF EXISTS "Admins have full access on categories" ON public.categories;
    DROP POLICY IF EXISTS "Everyone can view catalog_items" ON public.catalog_items;
    DROP POLICY IF EXISTS "Admins have full access on catalog_items" ON public.catalog_items;
    DROP POLICY IF EXISTS "Everyone can view inventory_items" ON public.inventory_items;
    DROP POLICY IF EXISTS "Admins have full access on inventory_items" ON public.inventory_items;
    DROP POLICY IF EXISTS "Employees can view batches" ON public.item_batches;
    DROP POLICY IF EXISTS "Admins have full access on item_batches" ON public.item_batches;
    DROP POLICY IF EXISTS "Employees can insert batches during IN" ON public.item_batches;
    DROP POLICY IF EXISTS "Employees can update batches qty during OUT" ON public.item_batches;
    DROP POLICY IF EXISTS "Employees can view their own movements" ON public.stock_movements;
    DROP POLICY IF EXISTS "Admins have full access on stock_movements" ON public.stock_movements;
    DROP POLICY IF EXISTS "Employees can insert movements" ON public.stock_movements;

    CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Admins have full access on categories" ON public.categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Everyone can view catalog_items" ON public.catalog_items FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Admins have full access on catalog_items" ON public.catalog_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Everyone can view inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Admins have full access on inventory_items" ON public.inventory_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Employees can view batches" ON public.item_batches FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Employees can insert batches during IN" ON public.item_batches FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Employees can update batches qty during OUT" ON public.item_batches FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Admins have full access on item_batches" ON public.item_batches FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

    CREATE POLICY "Employees can view their own movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Employees can insert movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
    CREATE POLICY "Admins have full access on stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
END $$;

-- 3. GRANTS
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.catalog_items TO authenticated;
GRANT SELECT ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.item_batches TO authenticated;
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 4. SEEDING
INSERT INTO public.categories (name)
SELECT name FROM (VALUES 
('Laticínios'), ('Carnes bovinas'), ('Carnes suínas'), ('Aves'), ('Peixes/frutos do mar'),
('Embutidos/frios'), ('Ovos'), ('Hortifruti'), ('Grãos/cereais'), ('Massas/farinhas'),
('Pães/panificação'), ('Confeitaria/sobremesas'), ('Congelados'), ('Enlatados/conservas'),
('Molhos/pastas'), ('Temperos/condimentos'), ('Óleos/gorduras'), ('Açúcares/adoçantes'),
('Água/refrigerantes/sucos'), ('Energéticos'), ('Cervejas'), ('Vinhos'), ('Destilados'),
('Licores'), ('Xaropes/mixers'), ('Gelo'), ('Guarnições de bar'), ('Descartáveis'),
('Embalagens'), ('Limpeza/higienização'), ('Utensílios/equipamentos'), ('EPIs'), ('Manutenção')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name = v.name);

DO $$ 
DECLARE 
    cat_id UUID;
BEGIN
    cat_id := (SELECT id FROM categories WHERE name = 'Laticínios');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Leite Integral 1L', cat_id, 'UN', true), ('Queijo Muçarela', cat_id, 'KG', true), 
    ('Queijo Prato', cat_id, 'KG', true), ('Queijo Parmesão', cat_id, 'KG', true),
    ('Manteiga com Sal', cat_id, 'KG', true), ('Creme de Leite 1kg', cat_id, 'UN', true),
    ('Leite Condensado 395g', cat_id, 'UN', true), ('Iogurte Natural', cat_id, 'L', true),
    ('Requeijão Cremoso', cat_id, 'KG', true), ('Queijo Gorgonzola', cat_id, 'KG', true)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Carnes bovinas');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Picanha Argentina', cat_id, 'KG', true), ('Filet Mignon', cat_id, 'KG', true),
    ('Contra Filé', cat_id, 'KG', true), ('Alcatra', cat_id, 'KG', true),
    ('Maminha', cat_id, 'KG', true), ('Fraldinha', cat_id, 'KG', true),
    ('Cupim', cat_id, 'KG', true), ('Costela Bovina', cat_id, 'KG', true),
    ('Carne Moída (Patinho)', cat_id, 'KG', true), ('Acém', cat_id, 'KG', true)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Aves');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Peito de Frango', cat_id, 'KG', true), ('Coxa e Sobrecoxa', cat_id, 'KG', true),
    ('Asa de Frango', cat_id, 'KG', true), ('Coração de Frango', cat_id, 'KG', true),
    ('Frango Inteiro', cat_id, 'KG', true)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Hortifruti');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Alface Crespa', cat_id, 'UN', true), ('Tomate Italiano', cat_id, 'KG', true),
    ('Cebola Branca', cat_id, 'KG', false), ('Alho Roxo', cat_id, 'KG', false),
    ('Batata Inglesa', cat_id, 'KG', false), ('Limão Taiti', cat_id, 'KG', false),
    ('Cenoura', cat_id, 'KG', false), ('Pimentão Verde', cat_id, 'KG', false),
    ('Ovo Branco (Cartela 30)', cat_id, 'UN', true), ('Banana Prata', cat_id, 'KG', true)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Cervejas');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Cerveja Stella Artois LN', cat_id, 'UN', false), ('Cerveja Heineken LN', cat_id, 'UN', false),
    ('Cerveja Corona LN', cat_id, 'UN', false), ('Cerveja Brahma Chopp Latão', cat_id, 'UN', false),
    ('Cerveja Skol Lata', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Destilados');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Vodka Absolut 1L', cat_id, 'UN', false), ('Gin Tanqueray 750ml', cat_id, 'UN', false),
    ('Whisky Red Label 1L', cat_id, 'UN', false), ('Whisky Black Label 1L', cat_id, 'UN', false),
    ('Cachaça 51 960ml', cat_id, 'UN', false), ('Tequila Jose Cuervo Ouro', cat_id, 'UN', false),
    ('Rum Bacardi Carta Blanca', cat_id, 'UN', false), ('Campari 900ml', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Água/refrigerantes/sucos');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Coca-Cola 350ml', cat_id, 'UN', false), ('Coca-Cola 2L', cat_id, 'UN', false),
    ('Guaraná Antarctica 350ml', cat_id, 'UN', false), ('Água Mineral sem Gás 500ml', cat_id, 'UN', false),
    ('Água Mineral com Gás 500ml', cat_id, 'UN', false), ('Suco de Laranja Integral 1L', cat_id, 'UN', true),
    ('Tônica Antarctica Lata', cat_id, 'UN', false), ('Soda Limonada Lata', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Grãos/cereais');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Arroz Agulhinha 5kg', cat_id, 'UN', false), ('Feijão Carioca 1kg', cat_id, 'UN', false),
    ('Sal Refinado 1kg', cat_id, 'UN', false), ('Açúcar Refinado 1kg', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Óleos/gorduras');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Óleo de Soja 900ml', cat_id, 'UN', false), ('Azeite de Oliva Extra Virgem 500ml', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Temperos/condimentos');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Ketchup Galão 3kg', cat_id, 'UN', true), ('Mostarda Galão 3kg', cat_id, 'UN', true),
    ('Maionese Galão 3kg', cat_id, 'UN', true), ('Molho Inglês', cat_id, 'UN', false),
    ('Molho de Pimenta', cat_id, 'UN', false), ('Orégano Seco 100g', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Gelo');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Gelo em Cubos 5kg', cat_id, 'UN', false), ('Gelo Triturado 5kg', cat_id, 'UN', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Guarnições de bar');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Azeitona Verde com Caroço', cat_id, 'KG', true), ('Cereja em Calda', cat_id, 'UN', true),
    ('Hortelã Maço', cat_id, 'UN', true)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'Limpeza/higienização');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Detergente Neutro 5L', cat_id, 'UN', false), ('Água Sanitária 5L', cat_id, 'UN', false),
    ('Desinfetante Lavanda 5L', cat_id, 'UN', false), ('Papel Toalha Interfolha', cat_id, 'FD', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

    cat_id := (SELECT id FROM categories WHERE name = 'EPIs');
    INSERT INTO catalog_items (name, category_id, unit_default, track_expiry)
    SELECT name, category_id, unit_default, track_expiry FROM (VALUES
    ('Luva Vinil P (100un)', cat_id, 'CX', false), ('Luva Vinil M (100un)', cat_id, 'CX', false),
    ('Touca Descartável (100un)', cat_id, 'CX', false)
    ) AS v(name, category_id, unit_default, track_expiry)
    WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.name = v.name AND ci.category_id = v.category_id);

END $$;
