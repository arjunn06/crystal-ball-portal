-- email_queue_wake(): originally created out-of-band by Lovable's setup tool and
-- only referenced by a later GRANT migration. Recreated as a thin wrapper that
-- triggers the dispatcher immediately instead of waiting for the next cron tick.
CREATE OR REPLACE FUNCTION public.email_queue_wake()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.email_queue_dispatch();
END;
$$;
