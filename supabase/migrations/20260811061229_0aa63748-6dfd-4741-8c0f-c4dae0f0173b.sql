-- 1. Membership must have a paid-through date in the future.
CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end > now()
  );
$$;

-- 2. Hourly entitlement sweep: reconcile with Razorpay, expire lapsed rows,
--    and remove Discord roles for anyone who no longer has access.
CREATE OR REPLACE FUNCTION public.subscription_sweep_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--35d9d475-f50f-4401-8711-f4dc6d659d17.lovable.app/api/public/cron/subscription-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.subscription_sweep_dispatch() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('subscription-sweep')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'subscription-sweep');

SELECT cron.schedule('subscription-sweep', '17 * * * *', $cron$ SELECT public.subscription_sweep_dispatch(); $cron$);