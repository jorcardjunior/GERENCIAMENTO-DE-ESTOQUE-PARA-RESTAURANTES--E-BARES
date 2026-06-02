-- ============================================================
-- MVP FIXES: Execute no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/pavtquqpgmirrmbdkqqd/sql/new
-- ============================================================

-- 1. Add columns for stock counting
ALTER TABLE public.inventory_items 
  ADD COLUMN IF NOT EXISTS count_date timestamptz,
  ADD COLUMN IF NOT EXISTS counted_by text;

-- 2. Test users (run this part if you haven't already)
-- Admin: admin@gmail.com / admin
-- Staff: staff@gmail.com / staff

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DELETE FROM public.profiles WHERE email IN ('admin@gmail.com', 'staff@gmail.com');
DELETE FROM auth.users WHERE email IN ('admin@gmail.com', 'staff@gmail.com');

-- Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@gmail.com', crypt('admin', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', NOW(), NOW(), '', '', '', '');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'staff@gmail.com', crypt('staff', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"funcionario"}', NOW(), NOW(), '', '', '', '');

INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Admin', email, 'admin' FROM auth.users WHERE email = 'admin@gmail.com';

INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Staff', email, 'funcionario' FROM auth.users WHERE email = 'staff@gmail.com';
