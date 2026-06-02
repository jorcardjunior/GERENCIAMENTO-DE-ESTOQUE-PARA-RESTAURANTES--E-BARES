DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='name') THEN
        ALTER TABLE public.inventory_items ALTER COLUMN name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='unit') THEN
        ALTER TABLE public.inventory_items ALTER COLUMN unit DROP NOT NULL;
    END IF;
END $$;

-- Retry seed
INSERT INTO public.inventory_items (catalog_item_id, current_stock, reorder_point, yellow_threshold, red_threshold)
SELECT id, 10, 5, 3, 1 FROM public.catalog_items
WHERE name IN ('Picanha Argentina', 'Leite Integral 1L', 'Cerveja Heineken LN', 'Limão Taiti', 'Coca-Cola 350ml', 'Gelo em Cubos 5kg')
ON CONFLICT DO NOTHING;
