UPDATE auth.users 
SET encrypted_password = crypt('personal', gen_salt('bf'))
WHERE email = 'personal@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('aluno', gen_salt('bf'))
WHERE email = 'aluno@gmail.com';
