DROP POLICY IF EXISTS "course covers read" ON storage.objects;
CREATE POLICY "course covers read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-covers');
DROP POLICY IF EXISTS "course covers admin insert" ON storage.objects;
CREATE POLICY "course covers admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "course covers admin update" ON storage.objects;
CREATE POLICY "course covers admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "course covers admin delete" ON storage.objects;
CREATE POLICY "course covers admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));