DROP VIEW IF EXISTS public.student_cumulative_scores;
CREATE VIEW public.student_cumulative_scores AS
SELECT
  s.id AS student_id,
  COALESCE(sum(bs.score), 0)::integer AS cumulative_score,
  (100 + COALESCE(sum(bs.score), 0))::integer AS remaining_marks,
  count(bs.id)::integer AS entries_count,
  max(bs.score_date) AS last_score_date
FROM public.students s
LEFT JOIN public.behavior_scores bs ON bs.student_id = s.id
GROUP BY s.id;