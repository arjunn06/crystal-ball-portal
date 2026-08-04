ALTER TABLE public.discord_config
  ADD COLUMN IF NOT EXISTS red_pill_role_ids text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS red_roles_cache jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pill public.pill_type NOT NULL DEFAULT 'blue';