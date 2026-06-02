
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars own list" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
