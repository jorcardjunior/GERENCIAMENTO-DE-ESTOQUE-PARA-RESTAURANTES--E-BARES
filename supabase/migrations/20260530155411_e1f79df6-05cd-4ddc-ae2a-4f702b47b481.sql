-- 1. Remove old constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Add professional roles for the restaurant ecosystem
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'employee'::text, 'manager'::text]));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text]));

-- 3. Ensure handle_new_user uses the correct roles (Updated in previous turn but reinforcing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email IN ('admin@gmail.com') THEN 'admin'
      ELSE 'employee'
    END,
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
