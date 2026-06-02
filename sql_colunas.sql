-- ============================================================
-- CORREÇÃO: Adiciona colunas necessárias ao inventory_items
-- Execute no Supabase SQL Editor antes de usar o app:
-- https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd/sql/new
-- ============================================================

ALTER TABLE public.inventory_items 
  ADD COLUMN IF NOT EXISTS count_date timestamptz,
  ADD COLUMN IF NOT EXISTS counted_by text;
