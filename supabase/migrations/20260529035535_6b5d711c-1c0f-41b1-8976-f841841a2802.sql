-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'trainer', 'admin')) NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- STUDENT_PROFILES
CREATE TABLE public.student_profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  age INT,
  weight NUMERIC,
  height NUMERIC,
  bmi NUMERIC,
  trained_before BOOLEAN,
  training_time_months INT,
  experience_level TEXT,
  goal TEXT,
  injuries_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TRAINER_PROFILES
CREATE TABLE public.trainer_profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT,
  certifications TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service_mode TEXT CHECK (service_mode IN ('online', 'presential', 'hybrid')),
  verified BOOLEAN DEFAULT false,
  rating_avg NUMERIC DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TRAINER_STUDENTS
CREATE TABLE public.trainer_students (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(trainer_id, student_id)
);

-- TRAINER_LEADS
CREATE TABLE public.trainer_leads (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WORKOUT_TEMPLATES
CREATE TABLE public.workout_templates (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level TEXT,
  goal TEXT,
  description TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.workout_template_exercises (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  sets INT,
  reps TEXT,
  rest_seconds INT,
  notes TEXT,
  order_index INT
);

-- STUDENT_WORKOUT_PLANS
CREATE TABLE public.student_workout_plans (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  created_by TEXT CHECK (created_by IN ('student', 'trainer')),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.student_workout_plan_exercises (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.student_workout_plans(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT,
  reps TEXT,
  rest_seconds INT,
  notes TEXT,
  order_index INT
);

-- WORKOUT_LOGS
CREATE TABLE public.workout_logs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.student_workout_plans(id) ON DELETE CASCADE,
  performed_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.workout_log_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight NUMERIC,
  reps INT,
  sets_done INT
);

-- NUTRITION_TEMPLATES
CREATE TABLE public.nutrition_templates (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  goal TEXT,
  description TEXT,
  disclaimer TEXT NOT NULL DEFAULT 'Conteúdo educativo. Não substitui orientação profissional. Para condições específicas, consulte nutricionista.',
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.nutrition_template_meals (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.nutrition_templates(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  order_index INT
);

CREATE TABLE public.nutrition_template_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.nutrition_template_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  grams NUMERIC,
  notes TEXT,
  image_url TEXT
);

-- STUDENT_NUTRITION_PLANS
CREATE TABLE public.student_nutrition_plans (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  goal TEXT,
  description TEXT,
  disclaimer TEXT NOT NULL DEFAULT 'Conteúdo educativo. Não substitui orientação profissional. Para condições específicas, consulte nutricionista.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.student_nutrition_meals (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.student_nutrition_plans(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  order_index INT
);

CREATE TABLE public.student_nutrition_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.student_nutrition_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  grams NUMERIC,
  notes TEXT,
  image_url TEXT
);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, trainer_id)
);

CREATE TABLE public.messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('text', 'image')) DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- FEEDBACKS
CREATE TABLE public.feedbacks (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('bug', 'suggestion', 'report')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'triage', 'resolved')),
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_template_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_workout_plan_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_log_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_template_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_template_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_nutrition_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_nutrition_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_nutrition_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_template_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_nutrition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public profiles are viewable by authenticated" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Student profiles are viewable by owner and trainer" ON public.student_profiles FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.trainer_students ts WHERE ts.student_id = public.student_profiles.user_id AND ts.trainer_id = auth.uid())
);
CREATE POLICY "Users can insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Trainer profiles are viewable by all" ON public.trainer_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own trainer profile" ON public.trainer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trainer profile" ON public.trainer_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Templates are viewable by all" ON public.workout_templates FOR SELECT USING (true);
CREATE POLICY "Template exercises are viewable by all" ON public.workout_template_exercises FOR SELECT USING (true);

CREATE POLICY "Nutrition templates are viewable by all" ON public.nutrition_templates FOR SELECT USING (true);
CREATE POLICY "Nutrition template meals are viewable by all" ON public.nutrition_template_meals FOR SELECT USING (true);
CREATE POLICY "Nutrition template items are viewable by all" ON public.nutrition_template_items FOR SELECT USING (true);

-- (Policies for leads, chat, and other private data would go here, scoping by user_id or trainer_id)
