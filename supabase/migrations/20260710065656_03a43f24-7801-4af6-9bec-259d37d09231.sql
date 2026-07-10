ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_oauth_state text,
  ADD COLUMN IF NOT EXISTS discord_oauth_state_expires_at timestamptz;
CREATE INDEX IF NOT EXISTS profiles_discord_oauth_state_idx ON public.profiles(discord_oauth_state);