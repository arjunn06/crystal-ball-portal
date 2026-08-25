CREATE TABLE public.redpill_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  waitlist_id uuid REFERENCES public.redpill_waitlist(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX redpill_invites_email_idx ON public.redpill_invites (lower(email));
GRANT SELECT ON public.redpill_invites TO authenticated;
GRANT ALL ON public.redpill_invites TO service_role;
ALTER TABLE public.redpill_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read redpill invites" ON public.redpill_invites FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));