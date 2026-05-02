-- Allow teachers to manage subjects (in addition to existing admin policy)
CREATE POLICY "Teachers can add subjects"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete subjects"
ON public.subjects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));