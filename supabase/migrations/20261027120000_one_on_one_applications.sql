CREATE TABLE public.one_on_one_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  location text NOT NULL,
  discord text,
  social text,
  experience text NOT NULL,
  stage text NOT NULL,
  ifvg_level text NOT NULL,
  markets text,
  struggle text NOT NULL,
  goal text NOT NULL,
  why_you text NOT NULL,
  hours_per_week text NOT NULL,
  investment text NOT NULL,
  availability text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'invited', 'declined')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX one_on_one_applications_status_idx ON public.one_on_one_applications (status, created_at DESC);
GRANT SELECT ON public.one_on_one_applications TO authenticated;
GRANT ALL ON public.one_on_one_applications TO service_role;
ALTER TABLE public.one_on_one_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read 1-1 applications" ON public.one_on_one_applications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
