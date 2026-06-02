DO $$
DECLARE
  p_id UUID;
  a_id UUID;
BEGIN
  -- Insert Personal
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'personal@gmail.com') THEN
    p_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      p_id, 
      'personal@gmail.com', 
      crypt('personal', gen_salt('bf')), 
      now(), 
      'authenticated', 
      'authenticated', 
      '',
      '{"provider":"email","providers":["email"]}',
      '{"role":"personal"}',
      now(), 
      now()
    );
  ELSE
    SELECT id INTO p_id FROM auth.users WHERE email = 'personal@gmail.com';
  END IF;

  -- Wait for trigger or just ensure profile exists
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (p_id, 'Personal Demo', 'personal')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'personal', display_name = 'Personal Demo';

  -- Insert Aluno
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'aluno@gmail.com') THEN
    a_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      a_id, 
      'aluno@gmail.com', 
      crypt('aluno', gen_salt('bf')), 
      now(), 
      'authenticated', 
      'authenticated', 
      '',
      '{"provider":"email","providers":["email"]}',
      '{"role":"aluno"}',
      now(), 
      now()
    );
  ELSE
    SELECT id INTO a_id FROM auth.users WHERE email = 'aluno@gmail.com';
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (a_id, 'Aluno Demo', 'aluno')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'aluno', display_name = 'Aluno Demo';

  -- Link aluno to personal
  INSERT INTO public.student_profiles (user_id, personal_id, goal)
  VALUES (a_id, p_id, 'Hipertrofia e Performance')
  ON CONFLICT (user_id) DO UPDATE SET personal_id = EXCLUDED.personal_id;
END $$;
