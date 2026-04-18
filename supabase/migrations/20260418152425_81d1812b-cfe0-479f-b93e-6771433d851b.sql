
DROP POLICY IF EXISTS "System inserts registrations" ON public.user_registrations;
DROP POLICY IF EXISTS "System inserts logs" ON public.activity_logs;

-- Only admins can manually insert; the SECURITY DEFINER trigger bypasses RLS
CREATE POLICY "Admins insert registrations"
  ON public.user_registrations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = actor_id);
