CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_membership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_membership(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "read published courses" ON public.courses;
CREATE POLICY "read published courses"
ON public.courses FOR SELECT TO authenticated
USING (published = true AND (public.has_active_membership(auth.uid()) OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "read modules of published" ON public.course_modules;
CREATE POLICY "read modules of published"
ON public.course_modules FOR SELECT TO authenticated
USING (
  (public.has_active_membership(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_modules.course_id AND c.published = true)
);

DROP POLICY IF EXISTS "read lessons of published" ON public.lessons;
CREATE POLICY "read lessons of published"
ON public.lessons FOR SELECT TO authenticated
USING (
  (public.has_active_membership(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id AND c.published = true
  )
);