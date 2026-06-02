export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category_id: string;
  unit_default: string;
  synonyms?: string | null;
  track_expiry: boolean;
  yellow_threshold: number;
  red_threshold: number;
  category?: Category;
}

export interface InventoryItem {
  id: string;
  catalog_item_id: string;
  current_stock: number;
  reorder_point: number;
  yellow_threshold: number;
  red_threshold: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  catalog_item?: CatalogItem;
}

export interface ItemBatch {
  id: string;
  inventory_item_id: string;
  batch_code?: string | null;
  qty_current: number;
  expires_at?: string | null;
  created_at?: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  batch_id?: string | null;
  type: 'IN' | 'OUT' | 'LOSS' | 'ADJUST';
  qty: number;
  reason?: string | null;
  created_by: string;
  created_at?: string;
}

export interface UserPermissions {
  can_add_items: boolean;
  can_view_reports: boolean;
  can_manage_suppliers: boolean;
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'funcionario';
  name: string;
  email: string;
  status: 'active' | 'inactive';
  can_add_items: boolean;
  can_view_reports: boolean;
  can_manage_suppliers: boolean;
}
