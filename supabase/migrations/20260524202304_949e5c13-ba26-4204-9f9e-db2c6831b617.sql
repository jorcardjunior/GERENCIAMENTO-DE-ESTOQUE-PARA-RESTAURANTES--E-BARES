
DO $$ BEGIN
  CREATE TYPE public.experience_level AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.somatotype AS ENUM ('ectomorph','mesomorph','endomorph');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_trained boolean,
  ADD COLUMN IF NOT EXISTS training_months integer,
  ADD COLUMN IF NOT EXISTS experience_level public.experience_level,
  ADD COLUMN IF NOT EXISTS somatotype public.somatotype,
  ADD COLUMN IF NOT EXISTS wrist_cm numeric,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
