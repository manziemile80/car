DROP VIEW IF EXISTS public.student_cumulative_scores;

CREATE VIEW public.student_cumulative_scores
WITH (security_invoker = true) AS
SELECT
  s.id AS student_id,
  COALESCE(SUM(bs.score), 0)::int AS cumulative_score,
  COUNT(bs.id)::int AS entries_count,
  MAX(bs.score_date) AS last_score_date
FROM public.students s
LEFT JOIN public.behavior_scores bs ON bs.student_id = s.id
GROUP BY s.id;

GRANT SELECT ON public.student_cumulative_scores TO authenticated;