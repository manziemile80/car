-- Drop constraint if it already exists then recreate it properly
ALTER TABLE public.behavior_scores
DROP CONSTRAINT IF EXISTS behavior_scores_teacher_id_fkey;

ALTER TABLE public.behavior_scores
DROP CONSTRAINT IF EXISTS behavior_scores_student_id_fkey;

-- Add foreign key for behavior_scores.teacher_id -> profiles.user_id
ALTER TABLE public.behavior_scores
ADD CONSTRAINT behavior_scores_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Add foreign key for behavior_scores.student_id -> students.id
ALTER TABLE public.behavior_scores
ADD CONSTRAINT behavior_scores_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Allow teachers to view all behavior scores (they can only manage their own, but need to see all)
DROP POLICY IF EXISTS "Teachers can view all behavior scores" ON public.behavior_scores;
CREATE POLICY "Teachers can view all behavior scores" 
ON public.behavior_scores 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow admins to manage all behavior scores
DROP POLICY IF EXISTS "Admins can view all behavior scores" ON public.behavior_scores;
DROP POLICY IF EXISTS "Admins can manage all behavior scores" ON public.behavior_scores;
CREATE POLICY "Admins can manage all behavior scores" 
ON public.behavior_scores 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow teachers to insert parents (for onboarding student parents)
DROP POLICY IF EXISTS "Teachers can add parents" ON public.parents;
CREATE POLICY "Teachers can add parents" 
ON public.parents 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all parents for student-parent linking
DROP POLICY IF EXISTS "Teachers can view parents" ON public.parents;
CREATE POLICY "Teachers can view parents" 
ON public.parents 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to manage student-parent links
DROP POLICY IF EXISTS "Teachers can manage student-parent links" ON public.student_parents;
CREATE POLICY "Teachers can manage student-parent links" 
ON public.student_parents 
FOR ALL 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to insert sms notifications
DROP POLICY IF EXISTS "Teachers can create sms notifications" ON public.sms_notifications;
CREATE POLICY "Teachers can create sms notifications" 
ON public.sms_notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view sms notifications they created
DROP POLICY IF EXISTS "Teachers can view sms notifications" ON public.sms_notifications;
CREATE POLICY "Teachers can view sms notifications" 
ON public.sms_notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));