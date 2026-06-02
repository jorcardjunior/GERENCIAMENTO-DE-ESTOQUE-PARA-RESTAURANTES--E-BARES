CREATE OR REPLACE FUNCTION public.update_inventory_stock(item_id UUID, change_qty NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.inventory_items
    SET current_stock = current_stock + change_qty,
        updated_at = now()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
