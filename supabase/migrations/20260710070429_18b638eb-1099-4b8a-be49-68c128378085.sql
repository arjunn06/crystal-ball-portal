ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_lower_uniq
  ON public.profiles ((lower(handle)))
  WHERE handle IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_handle_format
    CHECK (handle IS NULL OR handle ~ '^[a-zA-Z0-9_]{3,20}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reserved_handles (
  handle text PRIMARY KEY
);
GRANT SELECT ON public.reserved_handles TO anon, authenticated;
GRANT ALL ON public.reserved_handles TO service_role;
ALTER TABLE public.reserved_handles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reserved handles readable" ON public.reserved_handles;
CREATE POLICY "reserved handles readable"
  ON public.reserved_handles FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.reserved_handles(handle) VALUES
  ('admin'),('administrator'),('support'),('help'),('blueprint'),
  ('arjun'),('ifvg'),('root'),('system'),('mod'),('moderator'),
  ('official'),('team'),('staff'),('null'),('undefined'),('me'),('you')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars self upload" ON storage.objects;
CREATE POLICY "avatars self upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars self update" ON storage.objects;
CREATE POLICY "avatars self update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars self delete" ON storage.objects;
CREATE POLICY "avatars self delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );