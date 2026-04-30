import { format } from 'date-fns';
import { ScoreBadge } from './ScoreBadge';
import { BehaviorScoreWithDetails, BehaviorCategory } from '@/types/database';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentScoresTableProps {
  scores: BehaviorScoreWithDetails[];
  loading?: boolean;
}

const categoryLabels: Record<BehaviorCategory, string> = {
  discipline: 'Discipline',
  respect: 'Respect',
  attendance: 'Attendance',
  participation: 'Participation',
};

export function RecentScoresTable({ scores, loading }: RecentScoresTableProps) {
  const [remainingMap, setRemainingMap] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('student_cumulative_scores' as any).select('*');
      if (data) {
        const map: Record<string, number> = {};
        for (const row of data as any[]) {
          map[row.student_id] = row.remaining_marks ?? 100;
        }
        setRemainingMap(map);
      }
    })();
  }, [scores]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No behavior scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
              Student
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
              Category
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
              Score
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
              Remaining
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => (
            <tr key={score.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-foreground">
                    {score.student?.first_name} {score.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {score.student?.class?.name || 'No class'}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-foreground">
                  {categoryLabels[score.category]}
                </span>
              </td>
              <td className="px-4 py-4">
                <ScoreBadge score={score.score} />
              </td>
              <td className="px-4 py-4">
                {(() => {
                  const r = remainingMap[score.student_id] ?? 100;
                  const cls = r >= 50 ? 'text-success' : r >= 25 ? 'text-warning' : 'text-destructive';
                  return <span className={`font-semibold ${cls}`}>{r}/100</span>;
                })()}
              </td>
              <td className="px-4 py-4 text-sm text-muted-foreground">
                {format(new Date(score.score_date), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
