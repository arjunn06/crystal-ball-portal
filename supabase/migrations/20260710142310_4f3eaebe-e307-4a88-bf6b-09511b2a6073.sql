
CREATE TYPE public.promo_discount_type AS ENUM ('percent_off_first', 'amount_off_first', 'trial_days');

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type public.promo_discount_type NOT NULL,
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_redemptions INTEGER,
  per_user_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  redemptions_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  razorpay_offer_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX promo_codes_code_lower_idx ON public.promo_codes (lower(code));
CREATE INDEX promo_codes_active_idx ON public.promo_codes (active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes"
  ON public.promo_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can look up active promo codes"
  ON public.promo_codes FOR SELECT
  USING (active = true);

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX promo_redemptions_promo_idx ON public.promo_redemptions (promo_id);
CREATE INDEX promo_redemptions_user_idx ON public.promo_redemptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view promo redemptions"
  ON public.promo_redemptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view their own redemptions"
  ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id);
