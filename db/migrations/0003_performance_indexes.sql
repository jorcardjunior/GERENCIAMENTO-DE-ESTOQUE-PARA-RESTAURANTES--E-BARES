-- Performance indexes for production readiness
-- Created: 2026-06-23

-- Fix audit_events columns to accept text IDs (Better-Auth compat)
ALTER TABLE audit_events ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE audit_events ALTER COLUMN record_id TYPE text USING record_id::text;

-- Foreign key indexes (most critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_responsible_user ON items(responsible_user);

CREATE INDEX IF NOT EXISTS idx_estoque_estabelecimento_id ON estoque_estabelecimento(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_estoque_catalog_item_id ON estoque_estabelecimento(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_catalog_item ON movimentacoes_estoque(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_estoque(created_at);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_compra_itens(pedido_compra_id);
CREATE INDEX IF NOT EXISTS idx_transferencia_itens ON transferencia_itens(transferencia_id);

CREATE INDEX IF NOT EXISTS idx_expenses_estabelecimento ON expenses(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

CREATE INDEX IF NOT EXISTS idx_ficha_insumos_ficha ON ficha_tecnica_insumos(ficha_tecnica_id);
CREATE INDEX IF NOT EXISTS idx_ficha_estabelecimento ON fichas_tecnicas(estabelecimento_id);

-- Audit log index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);

-- Session cleanup index
CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_user ON session(user_id);

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_company ON "user"(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_better_auth ON users(better_auth_id);

-- Inventory/stock performance
CREATE INDEX IF NOT EXISTS idx_inventory_catalog ON inventory_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);

-- Production and loss reports
CREATE INDEX IF NOT EXISTS idx_producao_estabelecimento ON registros_producao(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_producao_data ON registros_producao(data_producao);
CREATE INDEX IF NOT EXISTS idx_perda_estabelecimento ON registros_perda(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_perda_data ON registros_perda(registered_at);

-- Cardapio
CREATE INDEX IF NOT EXISTS idx_cardapio_estabelecimento ON itens_cardapio(estabelecimento_id);

-- Fornecedores
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
