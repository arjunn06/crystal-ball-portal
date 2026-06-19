
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'red_pill', 'blue_pill');
CREATE TYPE public.pill_type AS ENUM ('red', 'blue');
CREATE TYPE public.application_status AS ENUM ('pending_call', 'call_scheduled', 'call_completed', 'approved', 'rejected', 'paid');
CREATE TYPE public.payment_status AS ENUM ('created', 'pending', 'success', 'failed', 'refunded');
CREATE TYPE public.subscription_status AS ENUM ('created', 'active', 'paused', 'cancelled', 'expired');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  discord_user_id TEXT,
  discord_username TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- pill_choices
CREATE TABLE public.pill_choices (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pill public.pill_type NOT NULL,
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pill_choices TO authenticated;
GRANT ALL ON public.pill_choices TO service_role;
ALTER TABLE public.pill_choices ENABLE ROW LEVEL SECURITY;

-- red_pill_applications
CREATE TABLE public.red_pill_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending_call',
  call_scheduled_at TIMESTAMPTZ,
  google_event_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.red_pill_applications TO authenticated;
GRANT ALL ON public.red_pill_applications TO service_role;
ALTER TABLE public.red_pill_applications ENABLE ROW LEVEL SECURITY;

-- bookings (monthly calls for Blue Pill, discovery calls reuse red_pill_applications)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  google_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pill public.pill_type NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status public.payment_status NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE,
  status public.subscription_status NOT NULL DEFAULT 'created',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own pill read" ON public.pill_choices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pill insert" ON public.pill_choices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pill update" ON public.pill_choices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin read all pills" ON public.pill_choices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own apps read" ON public.red_pill_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own apps insert" ON public.red_pill_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read all apps" ON public.red_pill_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update apps" ON public.red_pill_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own bookings read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bookings insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read all bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read all payments" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own subs read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin read all subs" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.red_pill_applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
