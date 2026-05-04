
-- Allow any teacher to update/delete marks (not only the original recorder)
DROP POLICY IF EXISTS "Teachers update own marks" ON public.marks;
DROP POLICY IF EXISTS "Teachers delete own marks" ON public.marks;

CREATE POLICY "Teachers update marks"
ON public.marks
FOR UPDATE
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers delete marks"
ON public.marks
FOR DELETE
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Add validation for mark ranges (CAT 0-40, Exam 0-60)
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS marks_cat_score_range;
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS marks_exam_score_range;
ALTER TABLE public.marks ADD CONSTRAINT marks_cat_score_range CHECK (cat_score >= 0 AND cat_score <= 40);
ALTER TABLE public.marks ADD CONSTRAINT marks_exam_score_range CHECK (exam_score >= 0 AND exam_score <= 60);
