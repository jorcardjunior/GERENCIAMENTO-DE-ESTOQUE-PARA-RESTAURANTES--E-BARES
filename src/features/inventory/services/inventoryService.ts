import { 
  InventoryItem, 
  Category, 
  StockMovement, 
  CatalogItem, 
  ItemBatch 
} from "@/types/inventory/index";
import { supabase } from "@/integrations/supabase/client";

/**
 * Professional Stock Management Service
 */
export const inventoryService = {
  // --- Categories ---
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as Category[];
  },

  // --- Catalog (Master Items) ---
  async getCatalogItems() {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*, category:categories(*)')
      .order('name');
    if (error) throw error;
    return data as (CatalogItem & { category: Category })[];
  },

  // --- Inventory Items ---
  async getInventoryItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        catalog_item:catalog_items(
          *,
          category:categories(*)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  // --- Batches ---
  async getItemBatches(inventoryItemId: string) {
    const { data, error } = await supabase
      .from('item_batches')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .gt('qty_current', 0)
      .order('expires_at', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data as ItemBatch[];
  },

  // --- Movements ---
  async addMovement(movement: {
    inventory_item_id: string;
    type: StockMovement['type'];
    qty: number;
    reason?: string;
    batch_id?: string;
    document_url?: string;
    document_type?: string;
    batch_data?: {
      batch_code?: string;
      expires_at?: string;
    }
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Handle OUT movements via FEFO RPC
    if (movement.type === 'OUT') {
      const { error: rpcError } = await supabase.rpc('process_stock_out', {
        p_item_id: movement.inventory_item_id,
        p_qty: movement.qty,
        p_user_id: user.id,
        p_reason: movement.reason || 'Consumo operacional'
      });
      if (rpcError) throw rpcError;
      return { success: true };
    }

    let finalBatchId = movement.batch_id;

    // 1. Handle IN movement
    if (movement.type === 'IN') {
      const { data: batch, error: batchError } = await supabase
        .from('item_batches')
        .insert({
          inventory_item_id: movement.inventory_item_id,
          batch_code: movement.batch_data?.batch_code,
          expires_at: movement.batch_data?.expires_at,
          qty_current: movement.qty
        })
        .select()
        .single();
      
      if (batchError) throw batchError;
      finalBatchId = batch.id;
    }

    // 2. Insert movement (for LOSS, ADJUST, IN)
    const { data: moveData, error: moveError } = await supabase
      .from('stock_movements')
      .insert({
        inventory_item_id: movement.inventory_item_id,
        batch_id: finalBatchId,
        type: movement.type,
        qty: movement.qty,
        reason: movement.reason,
        document_url: movement.document_url,
        document_type: movement.document_type,
        created_by: user.id,
        user_id: user.id
      })
      .select()
      .single();

    if (moveError) throw moveError;

    // 3. Update main inventory count
    const stockChange = movement.type === 'IN' ? movement.qty : -movement.qty;
    await supabase.rpc('update_inventory_stock', {
      item_id: movement.inventory_item_id,
      change_qty: stockChange
    });

    return moveData;
  },

  // --- Item Requests ---
  async createItemRequest(request: {
    name: string;
    suggested_category_id?: string;
    unit: string;
    notes?: string;
    photo_url?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('item_requests')
      .insert({
        ...request,
        requested_by: user.id,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getItemRequests() {
    const { data, error } = await supabase
      .from('item_requests')
      .select(`
        *,
        requested_by_profile:profiles!item_requests_requested_by_fkey(name, email),
        suggested_category:categories(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabase
      .from('item_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  },

  async getMyRecentMovements() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        inventory_item:inventory_items(
          catalog_item:catalog_items(name)
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data;
  }
};
