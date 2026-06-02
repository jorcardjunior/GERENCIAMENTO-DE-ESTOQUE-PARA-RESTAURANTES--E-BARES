
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_duration text,
  ADD COLUMN IF NOT EXISTS avatar_config jsonb,
  ADD COLUMN IF NOT EXISTS training_focus text,
  ADD COLUMN IF NOT EXISTS days_per_week integer;
