import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BehaviorScoreWithDetails, BehaviorCategory } from '@/types/database';
import { ScoreBadge } from '@/components/dashboard/ScoreBadge';
import { SmsNotificationsPanel } from './SmsNotificationsPanel';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface ScoreDetailsDialogProps {
  score: BehaviorScoreWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<BehaviorCategory, string> = {
  discipline: 'Discipline',
  respect: 'Respect',
  attendance: 'Attendance',
  participation: 'Participation',
};

export function ScoreDetailsDialog({
  score,
  open,
  onOpenChange,
}: ScoreDetailsDialogProps) {
  if (!score) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Score Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
              {score.student?.first_name?.charAt(0)}
              {score.student?.last_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">
                {score.student?.first_name} {score.student?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {score.student?.class?.name || 'No class'}
              </p>
            </div>
          </div>

          {/* Score Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">{categoryLabels[score.category]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score</p>
              <ScoreBadge score={score.score} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(score.score_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teacher</p>
              <p className="font-medium">{score.teacher?.full_name || 'Unknown'}</p>
            </div>
          </div>

          {/* Notes */}
          {score.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{score.notes}</p>
            </div>
          )}

          <Separator />

          {/* SMS Notifications */}
          <div>
            <p className="text-sm font-medium mb-3">SMS Notifications</p>
            <SmsNotificationsPanel behaviorScoreId={score.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
