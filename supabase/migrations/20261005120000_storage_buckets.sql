-- Storage buckets used by the app. The policies on storage.objects already exist
-- in earlier migrations, but the buckets themselves were created in the Lovable
-- dashboard, so a fresh project needs them. All three are private: the app hands
-- out signed URLs (see profile.functions.ts, courses.functions.ts).
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', false),
  ('course-covers', 'course-covers', false),
  ('lesson-videos', 'lesson-videos', false)
ON CONFLICT (id) DO NOTHING;
