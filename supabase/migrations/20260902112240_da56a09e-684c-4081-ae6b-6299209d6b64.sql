CREATE POLICY "Students view own record" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students view classes" ON public.classes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students view subjects" ON public.subjects FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students view own marks" ON public.marks FOR SELECT TO authenticated
  USING (student_id = public.get_current_student_id(auth.uid()));

CREATE POLICY "Students view own attendance" ON public.attendance FOR SELECT TO authenticated
  USING (student_id = public.get_current_student_id(auth.uid()));

CREATE POLICY "Students view own behavior scores" ON public.behavior_scores FOR SELECT TO authenticated
  USING (student_id = public.get_current_student_id(auth.uid()));

CREATE POLICY "Students view own report remarks" ON public.report_remarks FOR SELECT TO authenticated
  USING (student_id = public.get_current_student_id(auth.uid()));