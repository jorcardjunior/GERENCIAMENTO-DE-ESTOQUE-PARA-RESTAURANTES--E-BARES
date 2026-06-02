-- Drop conflicting tables to ensure clean MVP schema
DROP TABLE IF EXISTS public.workout_log_items CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.assigned_workouts CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps_or_time TEXT NOT NULL,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Create assigned_workouts table
CREATE TABLE public.assigned_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_logs table
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_log_items table
CREATE TABLE public.workout_log_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  load TEXT,
  reps_done INTEGER,
  done BOOLEAN DEFAULT false
);

-- Enable RLS and re-add policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workouts access" ON public.workouts
FOR ALL USING (auth.uid() = personal_id OR EXISTS (
  SELECT 1 FROM public.assigned_workouts WHERE workout_id = id AND student_id = auth.uid()
));

CREATE POLICY "Workout exercises access" ON public.workout_exercises
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.workouts WHERE id = workout_id AND (personal_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.assigned_workouts WHERE workout_id = id AND student_id = auth.uid()
  ))
));

CREATE POLICY "Assigned workouts access" ON public.assigned_workouts
FOR ALL USING (student_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
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
