
-- Admins fully manage lesson video files. Members never read raw files —
-- the app streams via short-lived signed URLs served by a server function.
CREATE POLICY "Admins manage lesson videos - select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lesson-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage lesson videos - insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage lesson videos - update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lesson-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage lesson videos - delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson-videos' AND public.has_role(auth.uid(), 'admin'));
