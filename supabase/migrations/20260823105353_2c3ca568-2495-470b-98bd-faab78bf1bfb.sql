CREATE TABLE public.redpill_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  phone text NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX redpill_waitlist_email_key ON public.redpill_waitlist (lower(email));
GRANT SELECT ON public.redpill_waitlist TO authenticated;
GRANT ALL ON public.redpill_waitlist TO service_role;
ALTER TABLE public.redpill_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read waitlist" ON public.redpill_waitlist FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));