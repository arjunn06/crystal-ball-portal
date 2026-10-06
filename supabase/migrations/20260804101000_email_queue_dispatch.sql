-- Email queue dispatcher. Originally created out-of-band by Lovable's setup tool;
-- recreated here so a fresh project has it. Calls the app's queue processor route
-- when there are pending messages and no rate-limit cooldown is active.
--
-- Requires two vault secrets (set once per project, see docs in the deploy notes):
--   app_base_url                 e.g. https://blueprint.ifvg.in   (no trailing slash)
--   email_queue_service_role_key the project's service_role key
CREATE OR REPLACE FUNCTION public.email_queue_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cooldown timestamptz;
  has_messages boolean;
  base_url text;
  service_key text;
BEGIN
  SELECT retry_after_until INTO cooldown FROM public.email_send_state LIMIT 1;
  IF cooldown IS NOT NULL AND cooldown > now() THEN
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pgmq.q_auth_emails WHERE vt <= now())
      OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails WHERE vt <= now())
    INTO has_messages;
  IF NOT has_messages THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO base_url FROM vault.decrypted_secrets WHERE name = 'app_base_url';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
  IF base_url IS NULL OR service_key IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := base_url || '/lovable/email/queue/process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

SELECT cron.unschedule('process-email-queue')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue');

SELECT cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT public.email_queue_dispatch(); $cron$);
