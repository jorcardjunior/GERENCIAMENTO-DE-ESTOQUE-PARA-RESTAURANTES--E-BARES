CREATE OR REPLACE FUNCTION public.process_stock_out(p_item_id UUID, p_qty NUMERIC, p_user_id UUID, p_reason TEXT)
RETURNS VOID AS $$
DECLARE
    r_batch RECORD;
    v_remaining_qty NUMERIC := p_qty;
    v_consume_qty NUMERIC;
BEGIN
    -- 1. Loop through active batches ordered by expiry (FEFO)
    FOR r_batch IN 
        SELECT id, qty_current 
        FROM public.item_batches 
        WHERE inventory_item_id = p_item_id AND qty_current > 0 
        ORDER BY expires_at ASC NULLS LAST, created_at ASC
    LOOP
        EXIT WHEN v_remaining_qty <= 0;

        v_consume_qty := LEAST(r_batch.qty_current, v_remaining_qty);
        
        -- Update batch
        UPDATE public.item_batches 
        SET qty_current = qty_current - v_consume_qty, updated_at = now() 
        WHERE id = r_batch.id;

        -- Record movement for this specific batch
        INSERT INTO public.stock_movements (inventory_item_id, batch_id, type, qty, reason, created_by, user_id)
        VALUES (p_item_id, r_batch.id, 'OUT', v_consume_qty, p_reason, p_user_id, p_user_id);

        v_remaining_qty := v_remaining_qty - v_consume_qty;
    END LOOP;

    -- 2. If there's still quantity remaining (over-consumption or no batches), record it as a general movement
    IF v_remaining_qty > 0 THEN
        INSERT INTO public.stock_movements (inventory_item_id, type, qty, reason, created_by, user_id)
        VALUES (p_item_id, 'OUT', v_remaining_qty, p_reason || ' (Excesso)', p_user_id, p_user_id);
    END IF;

    -- 3. Update main inventory count
    UPDATE public.inventory_items 
    SET current_stock = current_stock - p_qty, updated_at = now() 
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
