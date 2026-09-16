CREATE POLICY "Students create own record"
ON public.students FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'student'::app_role));