
CREATE POLICY "Teachers can delete students"
ON public.students FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete classes"
ON public.classes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));
