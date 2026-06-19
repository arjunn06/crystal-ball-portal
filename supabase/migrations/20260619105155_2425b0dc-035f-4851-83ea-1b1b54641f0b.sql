
-- Suspension flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  cover_url text,
  required_pill pill_type NOT NULL DEFAULT 'blue',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read published courses" ON public.courses FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Modules
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.course_modules (course_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read modules of published" ON public.course_modules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "admin manage modules" ON public.course_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  duration_seconds int,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.lessons (module_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read lessons of published" ON public.lessons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.published OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "admin manage lessons" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Lesson progress
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress read" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own progress insert" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress delete" ON public.lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin read progress" ON public.lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Discord claims
CREATE TYPE discord_claim_status AS ENUM ('pending', 'assigned', 'failed', 'revoked');
CREATE TABLE public.discord_role_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_user_id text NOT NULL,
  role_kind text NOT NULL DEFAULT 'blue_pill',
  status discord_claim_status NOT NULL DEFAULT 'pending',
  error_message text,
  actioned_by uuid REFERENCES auth.users(id),
  actioned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.discord_role_claims (user_id);
CREATE INDEX ON public.discord_role_claims (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discord_role_claims TO authenticated;
GRANT ALL ON public.discord_role_claims TO service_role;
ALTER TABLE public.discord_role_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own claim read" ON public.discord_role_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own claim insert" ON public.discord_role_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read all claims" ON public.discord_role_claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update claims" ON public.discord_role_claims FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.discord_role_claims
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-grant admin to arjun@ifvg.in
CREATE OR REPLACE FUNCTION public.grant_admin_for_seed_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'arjun@ifvg.in' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_grant_admin_seed ON auth.users;
CREATE TRIGGER trg_grant_admin_seed
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_seed_email();

-- Backfill: if arjun@ifvg.in already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'arjun@ifvg.in'
ON CONFLICT (user_id, role) DO NOTHING;
