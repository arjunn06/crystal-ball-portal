DROP INDEX IF EXISTS public.redpill_waitlist_email_key;
ALTER TABLE public.redpill_waitlist ADD CONSTRAINT redpill_waitlist_email_key UNIQUE (email);