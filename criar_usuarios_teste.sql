-- ============================================================
-- SCRIPT: CRIAR USUARIOS DE TESTE
-- Execute no SQL Editor do Supabase Dashboard
-- Dashboard: https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd
-- ============================================================

-- 1. Remover usuarios existentes de teste
DELETE FROM public.profiles WHERE email IN ('admin@gmail.com', 'funcionario@gmail.com');
DELETE FROM auth.users WHERE email IN ('admin@gmail.com', 'funcionario@gmail.com');

-- Ensure pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar usuario ADMIN
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gmail.com',
  -- Senha: Admin@2024 (criptografada com bcrypt)
  crypt('Admin@2024', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  NOW(), NOW(), '', '', '', ''
);

-- 3. Criar usuario FUNCIONARIO
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'funcionario@gmail.com',
  -- Senha: Func@2024
  crypt('Func@2024', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"funcionario"}',
  NOW(), NOW(), '', '', '', ''
);

-- 4. Criar profiles para os novos usuarios
INSERT INTO public.profiles (id, name, email, role, can_add_items, can_view_reports, can_manage_suppliers)
SELECT id, 'Admin', email, 'admin', true, true, true
FROM auth.users WHERE email = 'admin@gmail.com';

INSERT INTO public.profiles (id, name, email, role, can_add_items, can_view_reports, can_manage_suppliers)
SELECT id, 'Funcionario', email, 'funcionario', false, false, false
FROM auth.users WHERE email = 'funcionario@gmail.com';

-- 5. Verificar criacao
SELECT email, role, can_add_items, can_view_reports, can_manage_suppliers
FROM public.profiles
WHERE email IN ('admin@gmail.com', 'funcionario@gmail.com');
