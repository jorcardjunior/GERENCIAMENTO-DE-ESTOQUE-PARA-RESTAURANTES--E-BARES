-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create custom_projects table
CREATE TABLE IF NOT EXISTS public.custom_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('site', 'app')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_custom_projects_slug ON public.custom_projects(slug);
CREATE INDEX IF NOT EXISTS idx_custom_projects_user_id ON public.custom_projects(user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_projects TO authenticated;
GRANT ALL ON public.custom_projects TO service_role;

-- Enable RLS
ALTER TABLE public.custom_projects ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own projects') THEN
        CREATE POLICY "Users can manage their own projects"
        ON public.custom_projects
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published sites') THEN
        CREATE POLICY "Public can view published sites"
        ON public.custom_projects
        FOR SELECT
        USING (status = 'published');
    END IF;
END $$;

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_custom_projects_updated_at ON public.custom_projects;
CREATE TRIGGER update_custom_projects_updated_at
BEFORE UPDATE ON public.custom_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();