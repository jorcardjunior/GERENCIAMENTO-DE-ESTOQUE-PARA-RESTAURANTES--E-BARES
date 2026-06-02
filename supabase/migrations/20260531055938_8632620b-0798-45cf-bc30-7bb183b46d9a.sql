-- 1. Restrict catalog_items modification to admin/manager
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view catalog" ON public.catalog_items;
CREATE POLICY "Anyone can view catalog" ON public.catalog_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage catalog" ON public.catalog_items;
CREATE POLICY "Admins can manage catalog" ON public.catalog_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- 2. Create item_requests table
CREATE TABLE IF NOT EXISTS public.item_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  suggested_category_id UUID REFERENCES public.categories(id),
  unit TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for item_requests
ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_requests TO authenticated;
GRANT ALL ON public.item_requests TO service_role;

DROP POLICY IF EXISTS "Users can view their own requests" ON public.item_requests;
CREATE POLICY "Users can view their own requests"
  ON public.item_requests FOR SELECT
  USING (auth.uid() = requested_by OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

DROP POLICY IF EXISTS "Employees can create requests" ON public.item_requests;
CREATE POLICY "Employees can create requests"
  ON public.item_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Admins can update requests" ON public.item_requests;
CREATE POLICY "Admins can update requests"
  ON public.item_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- 3. Add document support to stock_movements
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT; -- 'invoice', 'receipt', 'photo', etc.

-- 4. Create trigger for updated_at on item_requests
CREATE TRIGGER update_item_requests_updated_at
BEFORE UPDATE ON public.item_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Storage bucket for requests and documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-requests', 'item-requests', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('movement-docs', 'movement-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Request photos are public" ON storage.objects;
CREATE POLICY "Request photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-requests');

DROP POLICY IF EXISTS "Auth users can upload request photos" ON storage.objects;
CREATE POLICY "Auth users can upload request photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-requests' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their movement docs" ON storage.objects;
CREATE POLICY "Users can view their movement docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'movement-docs' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
));

DROP POLICY IF EXISTS "Auth users can upload movement docs" ON storage.objects;
CREATE POLICY "Auth users can upload movement docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'movement-docs' AND auth.role() = 'authenticated');
