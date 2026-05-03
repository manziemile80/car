-- Allow teachers to update students and classes (admins keep full ALL via existing policies)
CREATE POLICY "Teachers can update students"
ON public.students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can insert students"
ON public.students FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update classes"
ON public.classes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can insert classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));