-- Extend profiles with role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'aluno';

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  goal TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adjust workouts table to have personal_id if it doesn't
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS personal_id UUID REFERENCES auth.users(id);
-- If user_id exists and we want to transition:
-- UPDATE public.workouts SET personal_id = user_id WHERE personal_id IS NULL;

-- Create assigned_workouts table
CREATE TABLE IF NOT EXISTS public.assigned_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_logs table
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_log_items table
CREATE TABLE IF NOT EXISTS public.workout_log_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  load TEXT,
  reps_done INTEGER,
  done BOOLEAN DEFAULT false
);

-- Create diets table
CREATE TABLE IF NOT EXISTS public.diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diet_meals table
CREATE TABLE IF NOT EXISTS public.diet_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diet_id UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Create diet_items table
CREATE TABLE IF NOT EXISTS public.diet_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diet_meal_id UUID NOT NULL REFERENCES public.diet_meals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity_text TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Create assigned_diets table
CREATE TABLE IF NOT EXISTS public.assigned_diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_id UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress_entries table
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2),
  waist NUMERIC(5,2),
  chest NUMERIC(5,2),
  hip NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (already enabled on some, but ensuring for all new ones)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using double quotes for names)

CREATE POLICY "Student profiles access" ON public.student_profiles
FOR ALL USING (auth.uid() = user_id OR auth.uid() = personal_id);

CREATE POLICY "Workouts models access" ON public.workouts
FOR ALL USING (auth.uid() = personal_id OR auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.assigned_workouts WHERE workout_id = id AND student_id = auth.uid()
));

CREATE POLICY "Workout logs access" ON public.workout_logs
FOR ALL USING (student_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Workout log items access" ON public.workout_log_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.workout_logs WHERE id = workout_log_id AND (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
  ))
));

CREATE POLICY "Diets access" ON public.diets
FOR ALL USING (auth.uid() = personal_id OR EXISTS (
  SELECT 1 FROM public.assigned_diets WHERE diet_id = id AND student_id = auth.uid()
));

CREATE POLICY "Diet meals access" ON public.diet_meals
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.diets WHERE id = diet_id AND (personal_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.assigned_diets WHERE diet_id = id AND student_id = auth.uid()
  ))
));

CREATE POLICY "Diet items access" ON public.diet_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.diet_meals dm JOIN public.diets d ON d.id = dm.diet_id WHERE dm.id = diet_meal_id AND (d.personal_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.assigned_diets WHERE diet_id = d.id AND student_id = auth.uid()
  ))
));

CREATE POLICY "Progress entries access" ON public.progress_entries
FOR ALL USING (student_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));
