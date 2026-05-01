CREATE TYPE public.school_term AS ENUM ('term1', 'term2', 'term3');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id, academic_year)
);

CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  term public.school_term NOT NULL,
  academic_year text NOT NULL,
  cat_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (cat_score >= 0 AND cat_score <= 40),
  exam_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, term, academic_year)
);

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  term public.school_term,
  academic_year text,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

CREATE TABLE public.report_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term public.school_term NOT NULL,
  academic_year text NOT NULL,
  class_teacher_remark text,
  principal_remark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, term, academic_year)
);

CREATE INDEX idx_marks_student ON public.marks(student_id, term, academic_year);
CREATE INDEX idx_marks_class_lookup ON public.marks(subject_id, term, academic_year);
CREATE INDEX idx_attendance_student ON public.attendance(student_id, attendance_date);
CREATE INDEX idx_class_subjects_class ON public.class_subjects(class_id);

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_report_remarks_updated_at BEFORE UPDATE ON public.report_remarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_remarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated view class_subjects" ON public.class_subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage class_subjects" ON public.class_subjects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all marks" ON public.marks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers view all marks" ON public.marks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers insert marks" ON public.marks
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Teachers update own marks" ON public.marks
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Teachers delete own marks" ON public.marks
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Parents view their children marks" ON public.marks
  FOR SELECT TO authenticated USING (student_id IN (SELECT public.get_parent_student_ids(auth.uid())));
CREATE POLICY "Viewers can view marks" ON public.marks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Admins manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Parents view their children attendance" ON public.attendance
  FOR SELECT TO authenticated USING (student_id IN (SELECT public.get_parent_student_ids(auth.uid())));
CREATE POLICY "Viewers view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Admins manage report remarks" ON public.report_remarks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers manage report remarks" ON public.report_remarks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Parents view their children remarks" ON public.report_remarks
  FOR SELECT TO authenticated USING (student_id IN (SELECT public.get_parent_student_ids(auth.uid())));
CREATE POLICY "Viewers view remarks" ON public.report_remarks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE OR REPLACE FUNCTION public.get_student_term_position(_student_id uuid, _term public.school_term, _academic_year text)
RETURNS TABLE(rank_position int, total_students int, student_average numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH student_class AS (
    SELECT class_id FROM public.students WHERE id = _student_id
  ),
  class_averages AS (
    SELECT s.id AS sid, COALESCE(AVG(m.cat_score + m.exam_score), 0) AS avg_score
    FROM public.students s
    LEFT JOIN public.marks m ON m.student_id = s.id AND m.term = _term AND m.academic_year = _academic_year
    WHERE s.class_id = (SELECT class_id FROM student_class)
    GROUP BY s.id
  ),
  ranked AS (
    SELECT sid, avg_score, RANK() OVER (ORDER BY avg_score DESC) AS rk
    FROM class_averages
  )
  SELECT
    (SELECT rk::int FROM ranked WHERE sid = _student_id),
    (SELECT COUNT(*)::int FROM class_averages),
    (SELECT avg_score::numeric FROM class_averages WHERE sid = _student_id)
$$;