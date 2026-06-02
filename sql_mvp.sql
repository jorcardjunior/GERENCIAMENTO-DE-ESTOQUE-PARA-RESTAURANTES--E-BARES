-- ============================================================
-- MVP: CRIAR USUARIOS DE TESTE
-- Execute no SQL Editor: https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remover existentes
DELETE FROM public.profiles WHERE email IN ('admin@gmail.com', 'staff@gmail.com', 'admin@eco.com');
DELETE FROM auth.users WHERE email IN ('admin@gmail.com', 'staff@gmail.com', 'admin@eco.com');

-- Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@gmail.com', crypt('admin', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', NOW(), NOW(), '', '', '', '');

-- Staff
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff@gmail.com', crypt('staff', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"staff"}', NOW(), NOW(), '', '', '', '');

-- Profiles
INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Admin', email, 'admin' FROM auth.users WHERE email = 'admin@gmail.com';

INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Staff', email, 'staff' FROM auth.users WHERE email = 'staff@gmail.com';
