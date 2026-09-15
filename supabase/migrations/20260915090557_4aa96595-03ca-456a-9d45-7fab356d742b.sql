CREATE POLICY "Students browse unclaimed records"
ON public.students FOR SELECT TO authenticated
USING (user_id IS NULL AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students claim unclaimed record"
ON public.students FOR UPDATE TO authenticated
USING (user_id IS NULL AND public.has_role(auth.uid(), 'student'))
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'student'));