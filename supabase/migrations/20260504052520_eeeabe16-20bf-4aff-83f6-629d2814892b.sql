
CREATE OR REPLACE VIEW public.student_cumulative_scores AS
SELECT s.id AS student_id,
    COALESCE(SUM(bs.score), 0)::integer AS cumulative_score,
    GREATEST(0, LEAST(100, 100 + COALESCE(SUM(bs.score), 0)))::integer AS remaining_marks,
    COUNT(bs.id)::integer AS entries_count,
    MAX(bs.score_date) AS last_score_date
FROM students s
LEFT JOIN behavior_scores bs ON bs.student_id = s.id
GROUP BY s.id;
