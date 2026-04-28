CREATE OR REPLACE FUNCTION public.get_student_cumulative_score(_student_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(score), 0)::int
  FROM public.behavior_scores
  WHERE student_id = _student_id
$$;

CREATE OR REPLACE VIEW public.student_cumulative_scores AS
SELECT
  s.id AS student_id,
  COALESCE(SUM(bs.score), 0)::int AS cumulative_score,
  COUNT(bs.id)::int AS entries_count,
  MAX(bs.score_date) AS last_score_date
FROM public.students s
LEFT JOIN public.behavior_scores bs ON bs.student_id = s.id
GROUP BY s.id;

GRANT SELECT ON public.student_cumulative_scores TO authenticated;