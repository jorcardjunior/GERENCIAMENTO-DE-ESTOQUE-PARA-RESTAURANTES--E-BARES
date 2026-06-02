-- ============================================================
-- COLUNAS CUSTOMIZÁVEIS (Seções extras)
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd/sql/new
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_columns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;
