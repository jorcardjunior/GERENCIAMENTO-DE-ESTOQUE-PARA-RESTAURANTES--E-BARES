UPDATE auth.users 
SET encrypted_password = crypt('personal', gen_salt('bf', 10)),
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = NULL,
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}',
    is_super_admin = false
WHERE email = 'personal@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('aluno', gen_salt('bf', 10)),
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = NULL,
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}',
    is_super_admin = false
WHERE email = 'aluno@gmail.com';
