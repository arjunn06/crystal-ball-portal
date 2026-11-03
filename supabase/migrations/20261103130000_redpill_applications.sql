CREATE TABLE public.redpill_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 10 AND 99),
  stage text NOT NULL,
  ready_to_pay text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'invited', 'declined')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX redpill_applications_status_idx ON public.redpill_applications (status, created_at DESC);
GRANT SELECT ON public.redpill_applications TO authenticated;
GRANT ALL ON public.redpill_applications TO service_role;
ALTER TABLE public.redpill_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read Red Pill applications" ON public.redpill_applications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
NOTIFY pgrst, 'reload schema';
