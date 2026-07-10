
CREATE TABLE public.discord_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  guild_id text,
  guild_name text,
  guild_icon text,
  role_ids text[] NOT NULL DEFAULT '{}',
  roles_cache jsonb NOT NULL DEFAULT '[]'::jsonb,
  bot_installed_at timestamptz,
  oauth_state text,
  oauth_state_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discord_config TO authenticated;
GRANT ALL ON public.discord_config TO service_role;

ALTER TABLE public.discord_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read discord_config"
  ON public.discord_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can modify discord_config"
  ON public.discord_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_discord_config_updated_at
  BEFORE UPDATE ON public.discord_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

INSERT INTO public.discord_config (id) VALUES (1) ON CONFLICT DO NOTHING;
