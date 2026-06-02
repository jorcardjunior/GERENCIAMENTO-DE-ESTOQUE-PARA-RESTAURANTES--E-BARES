-- Função para incrementar estoque
CREATE OR REPLACE FUNCTION public.increment_stock(x decimal, row_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.inventory_items
  SET current_stock = current_stock + x
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar estoque
CREATE OR REPLACE FUNCTION public.decrement_stock(x decimal, row_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.inventory_items
  SET current_stock = current_stock - x
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
