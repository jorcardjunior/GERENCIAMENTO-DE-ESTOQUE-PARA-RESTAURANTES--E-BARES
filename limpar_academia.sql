-- ============================================================
-- SCRIPT: LIMPAR TABELAS DE ACADEMIA
-- Projeto: GERENCIAMENTO DE ESTOQUE PARA RESTAURANTES E BARES
-- Instrucao: Cole no SQL Editor do Supabase Dashboard
-- Dashboard: https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd
-- ============================================================

-- 1. DROP TABELAS DE ACADEMIA (ordem correta para FK)
DROP TABLE IF EXISTS workout_log_items CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS student_workout_plan_exercises CASCADE;
DROP TABLE IF EXISTS student_workout_plans CASCADE;
DROP TABLE IF EXISTS workout_template_exercises CASCADE;
DROP TABLE IF EXISTS workout_templates CASCADE;

DROP TABLE IF EXISTS student_nutrition_items CASCADE;
DROP TABLE IF EXISTS student_nutrition_meals CASCADE;
DROP TABLE IF EXISTS student_nutrition_plans CASCADE;

DROP TABLE IF EXISTS nutrition_template_items CASCADE;
DROP TABLE IF EXISTS nutrition_template_meals CASCADE;
DROP TABLE IF EXISTS nutrition_templates CASCADE;

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

DROP TABLE IF EXISTS trainer_leads CASCADE;
DROP TABLE IF EXISTS trainer_students CASCADE;
DROP TABLE IF EXISTS trainer_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;

DROP TABLE IF EXISTS feedbacks CASCADE;

-- 2. DROP ENUMS DE ACADEMIA
DROP TYPE IF EXISTS experience_level CASCADE;
DROP TYPE IF EXISTS metric_type CASCADE;
DROP TYPE IF EXISTS muscle_group CASCADE;
DROP TYPE IF EXISTS somatotype CASCADE;

-- 3. LIMPAR DADOS DE ACADEMIA NA TABELA profiles
-- Remove usuarios com role 'student' ou 'trainer' (mantem 'admin')
-- NOTA: Isso NAO deleta o usuario do auth.users, apenas o perfil
DELETE FROM profiles WHERE role IN ('student', 'trainer');

-- 4. TABELAS MANTIDAS (estoque):
-- categories, catalog_items, inventory_items, item_batches,
-- stock_movements, suppliers, item_requests, audit_events, profiles

-- 5. FUNCOES MANTIDAS (estoque):
-- decrement_stock, increment_stock, process_stock_out, update_inventory_stock
