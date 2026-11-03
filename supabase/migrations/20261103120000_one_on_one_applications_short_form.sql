-- The application form was shortened. These columns are no longer collected.
ALTER TABLE public.one_on_one_applications
  ALTER COLUMN location DROP NOT NULL,
  ALTER COLUMN ifvg_level DROP NOT NULL,
  ALTER COLUMN struggle DROP NOT NULL,
  ALTER COLUMN goal DROP NOT NULL,
  ALTER COLUMN hours_per_week DROP NOT NULL,
  ALTER COLUMN availability DROP NOT NULL;
NOTIFY pgrst, 'reload schema';
