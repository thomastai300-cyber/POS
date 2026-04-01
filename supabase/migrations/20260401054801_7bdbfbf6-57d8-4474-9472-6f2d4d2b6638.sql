
-- 1. Fix profiles: only own profile or admins can view
DROP POLICY "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix activity_logs: only admins can view all, others see own logs
DROP POLICY "Authenticated users can view activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own logs or admins view all"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix role_permissions: only allow viewing permissions for user's own role or admins
DROP POLICY "All authenticated users can view permissions" ON public.role_permissions;
CREATE POLICY "Users can view own role permissions or admins view all"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (
    role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() ORDER BY ur.assigned_at DESC LIMIT 1)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
